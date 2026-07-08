import { BadRequestException } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { OrderEntity } from './order.entity';
import { EventEntity } from '../events/event.entity';
import { OrderStatus } from '../../constants/enums/order.enums';
import { EventStatus } from '../../constants/enums/event.enums';

function makeConfig() {
  return {
    get: (key: string) => {
      if (key === 'epg') return { currency: '051', amountMultiplier: 100 };
      if (key === 'frontendUrl') return 'https://front.test';
      return undefined;
    },
  } as any;
}

describe('OrdersService.computeAmount', () => {
  it('multiplies price by guests and multiplier', () => {
    const svc = new OrdersService(null as any, null as any, makeConfig(), null as any, null as any);
    expect(svc.computeAmount(5, 2)).toBe(1000); // 5 * 2 * 100
    expect(svc.computeAmount(0, 3)).toBe(0);
  });
});

describe('OrdersService.checkout', () => {
  const activeEvent = {
    id: 7, slug: 'dinner', status: EventStatus.ACTIVE, price: 5,
    maxCapacity: 10, bookedCount: 0, title: { en: 'Dinner', hy: '' },
  };

  function setup(event: any) {
    // Shared, mutable event row so the locked lookup inside markPaid's
    // transaction sees the same object the transaction mutates (realistic
    // pessimistic-lock behavior).
    const eventRow = { ...event };
    const savedOrders: any[] = [];

    // EntityManager double used inside markPaid's transaction. Both the order
    // and the event are now read under a write lock, so we distinguish them by
    // the ENTITY CLASS (first arg), not by the presence of a lock option.
    const managerMock = {
      findOne: jest.fn(async (entity: any) => {
        if (entity === EventEntity) return eventRow;
        return savedOrders[savedOrders.length - 1];
      }),
      save: jest.fn(async (x: any) => x),
    };

    const orderRepo = {
      create: (x: any) => x,
      save: jest.fn(async (x: any) => {
        const existing = savedOrders.find((o) => o.orderNumber === x.orderNumber);
        if (existing) {
          Object.assign(existing, x);
          return existing;
        }
        const o = { id: 1, capacityApplied: false, ...x };
        savedOrders.push(o);
        return o;
      }),
      manager: { transaction: async (cb: any) => cb(managerMock) },
    };
    const eventRepo = { findOne: jest.fn(async () => event) };
    const epg = { register: jest.fn(async () => ({ orderId: 'oid', formUrl: 'https://epg/p/1' })) };
    const mail = { sendCustomerConfirmation: jest.fn() };
    const svc = new OrdersService(orderRepo as any, eventRepo as any, makeConfig(), epg as any, mail as any);
    return { svc, orderRepo, eventRepo, epg, mail, eventRow, savedOrders };
  }

  it('registers with EPG and returns formUrl for a paid event', async () => {
    const { svc, epg } = setup(activeEvent);
    const res = await svc.checkout({ slug: 'dinner', guests: 2, firstName: 'A', email: 'a@b.c', locale: 'en' } as any);
    expect(epg.register).toHaveBeenCalled();
    expect(res.formUrl).toBe('https://epg/p/1');
    expect(res.orderNumber).toBeTruthy();
  });

  it('rejects when the event is not active', async () => {
    const { svc } = setup({ ...activeEvent, status: EventStatus.DRAFT });
    await expect(
      svc.checkout({ slug: 'dinner', guests: 1, firstName: 'A', email: 'a@b.c', locale: 'en' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects when there is not enough capacity', async () => {
    const { svc } = setup({ ...activeEvent, bookedCount: 9 });
    await expect(
      svc.checkout({ slug: 'dinner', guests: 2, firstName: 'A', email: 'a@b.c', locale: 'en' } as any),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('skips EPG for a free event and returns redirectTo', async () => {
    const { svc, epg, mail, eventRow } = setup({ ...activeEvent, price: 0 });
    const res = await svc.checkout({ slug: 'dinner', guests: 1, firstName: 'A', email: 'a@b.c', locale: 'en' } as any);
    expect(epg.register).not.toHaveBeenCalled();
    expect(res.redirectTo).toContain('/confirmed');
    // The real markPaid transaction ran: capacity applied once, emails sent once.
    expect(eventRow.bookedCount).toBe(1);
    expect(mail.sendCustomerConfirmation).toHaveBeenCalledTimes(1);
  });
});

describe('OrdersService.verify idempotency', () => {
  const guests = 2;

  function setup() {
    const eventRow = { id: 7, bookedCount: 0 };
    // Authoritative order row read INSIDE the transaction (under lock). Its
    // capacityApplied is the single source of truth the guard checks.
    const orderRow: any = {
      id: 1,
      orderNumber: 'on-1',
      eventId: 7,
      guests,
      epgOrderId: 'epg-1',
      status: OrderStatus.PENDING,
      capacityApplied: false,
      paymentDate: null,
    };

    // Transaction manager double: switch on entity class. The order row is now
    // also read under a write lock, so the shared authoritative order row is
    // returned for OrderEntity and the shared event row for EventEntity. The
    // transaction mutates these shared objects in place, so the second call's
    // transaction observes the already-committed capacityApplied === true.
    const managerMock = {
      findOne: jest.fn(async (entity: any) => {
        if (entity === EventEntity) return eventRow;
        return orderRow;
      }),
      save: jest.fn(async (x: any) => x),
    };

    const orderRepo: any = {
      // findByOrderNumber returns a FRESH PENDING snapshot every time, modeling
      // two concurrent verify() requests that both read the order as PENDING
      // before either commits. Both therefore pass the terminal-status gate and
      // reach markPaid — so exactly-once is enforced by the transactional
      // order-row lock + capacityApplied guard, not by verify()'s short-circuit.
      findOne: jest.fn(async () => ({
        id: 1,
        orderNumber: 'on-1',
        eventId: 7,
        guests,
        epgOrderId: 'epg-1',
        status: OrderStatus.PENDING,
        capacityApplied: false,
      })),
      save: jest.fn(async (x: any) => x),
      manager: { transaction: async (cb: any) => cb(managerMock) },
    };
    const eventRepo = { findOne: jest.fn() };
    const epg = {
      getOrderStatusExtended: jest.fn(async () => ({
        orderStatus: 2, // -> PAID
        actionCode: '0',
        actionCodeDescription: 'ok',
        panMasked: '411111**1111',
      })),
    };
    const mail = { sendCustomerConfirmation: jest.fn() };
    const svc = new OrdersService(orderRepo as any, eventRepo as any, makeConfig(), epg as any, mail as any);
    return { svc, epg, mail, eventRow, orderRow, orderRepo, managerMock };
  }

  it('applies capacity and sends emails exactly once across repeated verify() calls', async () => {
    const { svc, mail, eventRow, orderRow, orderRepo, managerMock } = setup();

    const first = await svc.verify('on-1');
    expect(first.status).toBe(OrderStatus.PAID);
    expect(eventRow.bookedCount).toBe(guests); // 0 -> 2
    expect(orderRow.capacityApplied).toBe(true);
    expect(mail.sendCustomerConfirmation).toHaveBeenCalledTimes(1);

    // Fix A regression guard: verify() must NOT persist the stale unlocked
    // snapshot via the top-level repo. All PAID writes go through markPaid's
    // locked transaction (manager.save), never orderRepo.save.
    expect(orderRepo.save).not.toHaveBeenCalled();
    // Gateway metadata is persisted under the lock, not dropped.
    expect(orderRow.panMasked).toBe('411111**1111');

    // markPaid MUST take a write lock on the order row so concurrent verifies
    // serialize (Fix A). Assert the lock option is actually requested.
    expect(managerMock.findOne).toHaveBeenCalledWith(
      OrderEntity,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );

    // Second verify (modeling a concurrent/duplicate request) also reaches
    // markPaid, but the transactional capacityApplied guard prevents a second
    // capacity bump and a second set of emails.
    const second = await svc.verify('on-1');
    expect(second.status).toBe(OrderStatus.PAID);
    expect(eventRow.bookedCount).toBe(guests); // unchanged — guard held
    expect(mail.sendCustomerConfirmation).toHaveBeenCalledTimes(1);
  });
});

describe('OrdersService.verify non-PAID', () => {
  it('maps a declined order to FAILED via a targeted update, without side effects', async () => {
    const updateCalls: any[] = [];
    const orderRepo: any = {
      findOne: jest.fn(async ({ where }: any) => {
        if (where?.orderNumber) {
          return {
            id: 1, orderNumber: 'on-1', eventId: 7, guests: 2,
            epgOrderId: 'epg-1', status: OrderStatus.PENDING, capacityApplied: false,
          };
        }
        // findById after the update
        return { id: 1, orderNumber: 'on-1', status: OrderStatus.FAILED, actionCode: '99' };
      }),
      update: jest.fn(async (id: number, patch: any) => { updateCalls.push({ id, patch }); }),
      save: jest.fn(async (x: any) => x),
      manager: { transaction: jest.fn() },
    };
    const eventRepo = { findOne: jest.fn() };
    const epg = {
      getOrderStatusExtended: jest.fn(async () => ({
        orderStatus: 6, // -> FAILED
        actionCode: '99',
        actionCodeDescription: 'Declined',
        panMasked: null,
      })),
    };
    const mail = { sendCustomerConfirmation: jest.fn() };
    const svc = new OrdersService(orderRepo as any, eventRepo as any, makeConfig(), epg as any, mail as any);

    const res = await svc.verify('on-1');

    expect(res.status).toBe(OrderStatus.FAILED);
    // Targeted update with status + metadata only.
    expect(orderRepo.update).toHaveBeenCalledWith(1, expect.objectContaining({
      status: OrderStatus.FAILED,
      actionCode: '99',
      actionCodeDescription: 'Declined',
    }));
    // Fix A regression guard: no stale full-entity save, no locked transaction,
    // no capacity/email side effects for a non-PAID result.
    expect(orderRepo.save).not.toHaveBeenCalled();
    expect(orderRepo.manager.transaction).not.toHaveBeenCalled();
    expect(mail.sendCustomerConfirmation).not.toHaveBeenCalled();
  });
});

describe('OrdersService.refund / reverse', () => {
  const guests = 3;

  // Builds a service whose orderRepo.manager.transaction runs against shared,
  // mutable order + event rows, with findOne switching on the entity class.
  function setup(orderOverrides: any) {
    const eventRow = { id: 7, bookedCount: 5 };
    const orderRow: any = {
      id: 1,
      orderNumber: 'on-1',
      eventId: 7,
      guests,
      amount: 900,
      epgOrderId: 'epg-1',
      status: OrderStatus.PAID,
      capacityApplied: true,
      ...orderOverrides,
    };

    const managerMock = {
      findOne: jest.fn(async (entity: any) => {
        if (entity === EventEntity) return eventRow;
        return orderRow;
      }),
      save: jest.fn(async (x: any) => x),
    };
    const orderRepo = {
      manager: { transaction: async (cb: any) => cb(managerMock) },
    };
    const eventRepo = { findOne: jest.fn() };
    const epg = { refund: jest.fn(async () => undefined), reverse: jest.fn(async () => undefined) };
    const mail = { sendCustomerConfirmation: jest.fn() };
    const svc = new OrdersService(orderRepo as any, eventRepo as any, makeConfig(), epg as any, mail as any);
    return { svc, epg, eventRow, orderRow, managerMock };
  }

  it('refunds a paid order: calls EPG once, releases capacity, sets refunded', async () => {
    const { svc, epg, eventRow, managerMock } = setup({});
    const res = await svc.refund(1);
    expect(epg.refund).toHaveBeenCalledTimes(1);
    expect(epg.refund).toHaveBeenCalledWith('epg-1', 900);
    expect(eventRow.bookedCount).toBe(5 - guests); // released once
    expect(res.status).toBe(OrderStatus.REFUNDED);
    expect(res.capacityApplied).toBe(false);
    // refund MUST lock the order row inside the transaction (Fix B).
    expect(managerMock.findOne).toHaveBeenCalledWith(
      OrderEntity,
      expect.objectContaining({ lock: { mode: 'pessimistic_write' } }),
    );
  });

  it('rejects refunding a non-paid order and does not call EPG', async () => {
    const { svc, epg } = setup({ status: OrderStatus.PENDING });
    await expect(svc.refund(1)).rejects.toBeInstanceOf(BadRequestException);
    expect(epg.refund).not.toHaveBeenCalled();
  });

  it('refunds a free paid order without calling EPG', async () => {
    const { svc, epg, eventRow } = setup({ amount: 0, epgOrderId: null });
    const res = await svc.refund(1);
    expect(epg.refund).not.toHaveBeenCalled();
    expect(eventRow.bookedCount).toBe(5 - guests);
    expect(res.status).toBe(OrderStatus.REFUNDED);
  });

  it('reverses a paid order: calls EPG once, sets reversed', async () => {
    const { svc, epg, eventRow } = setup({});
    const res = await svc.reverse(1);
    expect(epg.reverse).toHaveBeenCalledTimes(1);
    expect(epg.reverse).toHaveBeenCalledWith('epg-1');
    expect(eventRow.bookedCount).toBe(5 - guests);
    expect(res.status).toBe(OrderStatus.REVERSED);
  });
});

import { randomUUID } from 'crypto';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { EntityManager, Repository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { OrderStatus } from '../../constants/enums/order.enums';
import { EventEntity } from '../events/event.entity';
import { EventStatus } from '../../constants/enums/event.enums';
import { EpgService, EpgStatusResult, PAYMENT_PAGE_MINUTES, statusFromEpg } from './epg.service';
import { OrdersMailService } from './orders-mail.service';
import { buildParticipantsPdf } from './participants-pdf';
import { buildOrdersPdf } from './orders-pdf';
import { pickLocaleText } from '../events/event-i18n.types';
import { CheckoutDto } from './dto/checkout.dto';
import { IPaginationData, IPaginationDTO } from '../../constants/interfaces/pagination.interfaces';
import { PromoCodesService, applyDiscount, INVALID_PROMO } from '../promo-codes/promo-codes.service';
import { PromoCodeEntity } from '../promo-codes/promo-code.entity';

interface EpgConfig { currency: string; amountMultiplier: number; }

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(OrderEntity)
    private readonly orderRepo: Repository<OrderEntity>,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
    private readonly config: ConfigService,
    private readonly epg: EpgService,
    private readonly mail: OrdersMailService,
    private readonly promos: PromoCodesService,
  ) {}

  private get epgConfig(): EpgConfig {
    return this.config.get<EpgConfig>('epg');
  }

  computeAmount(price: number, guests: number, discountPercent = 0): number {
    return applyDiscount(price * guests, discountPercent) * this.epgConfig.amountMultiplier;
  }

  /** Public pre-checkout check so the booking page can preview the discount. */
  async checkPromo(slug: string, code: string, client: string): Promise<{ code: string; discountPercent: number }> {
    const event = await this.eventRepo.findOne({ where: { slug } });
    if (!event) throw new NotFoundException(`Event "${slug}" not found`);
    if (!event.promoEnabled) throw new BadRequestException('Promo codes are not accepted for this event');
    const promo = await this.promos.resolve(code, event.id, client);
    return { code: promo.code, discountPercent: promo.discountPercent };
  }

  /**
   * Saves the pending order only if the promo still has a free use, counting paid uses
   * plus pending orders inside the bank's payment window. The promo row lock serializes
   * concurrent checkouts so two customers can't both take the last use.
   */
  private reservePromoUse(order: OrderEntity, promo: PromoCodeEntity): Promise<OrderEntity> {
    return this.orderRepo.manager.transaction(async (m) => {
      const locked = await m.findOne(PromoCodeEntity, { where: { id: promo.id }, lock: { mode: 'pessimistic_write' } });
      const held = await m.createQueryBuilder(OrderEntity, 'o')
        .where('o.promoCode = :code AND o.status = :status', { code: promo.code, status: OrderStatus.PENDING })
        .andWhere(`o.createdAt > LOCALTIMESTAMP - make_interval(mins => :mins)`, { mins: PAYMENT_PAGE_MINUTES })
        .getCount();
      if (!locked || (locked.maxUses != null && locked.usedCount + held >= locked.maxUses)) {
        throw new BadRequestException(INVALID_PROMO);
      }
      return m.save(order);
    });
  }

  private buildReturnUrl(locale: string, slug: string, orderNumber: string): string {
    const front = this.config.get<string>('frontendUrl');
    return `${front}/${locale}/events/${slug}/confirmed?orderNumber=${orderNumber}`;
  }

  async findById(id: number): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException(`Order #${id} not found`);
    return order;
  }

  /** Check-in PDF of an event's paid bookings and their guests, oldest booking first. */
  async participantsPdf(eventId: number): Promise<{ pdf: Buffer; slug: string }> {
    const event = await this.eventRepo.findOne({ where: { id: eventId } });
    if (!event) throw new NotFoundException(`Event #${eventId} not found`);
    const orders = await this.orderRepo.find({
      where: { eventId, status: OrderStatus.PAID },
      order: { createdAt: 'ASC' },
    });
    const fullName = (first?: string | null, last?: string | null) => [first, last].filter(Boolean).join(' ') || '—';
    const pdf = await buildParticipantsPdf({
      title: pickLocaleText(event.title, 'en') || event.slug,
      when: this.mail.formatEventWhen(event),
      where: this.mail.locationText(event),
      bookings: orders.map((o) => ({
        name: fullName(o.firstName, o.lastName),
        phone: o.phone ?? '—',
        email: o.email,
        reference: o.orderNumber,
        guests: (o.guestDetails ?? []).map((g) => ({ name: fullName(g.firstName, g.lastName), phone: g.phone ?? '—' })),
      })),
    });
    return { pdf, slug: event.slug };
  }

  /** PDF of the orders matching the admin list filters (same filters as the CSV export). */
  async ordersPdf(options: IPaginationDTO<OrderEntity>): Promise<Buffer> {
    const { items } = await this.paginate({ ...options, offset: 0, limit: 10000 });
    const filter = (options.filter ?? {}) as { status?: string; eventId?: number; search?: string };

    const filters: string[] = [];
    if (filter.eventId) {
      const event = await this.eventRepo.findOne({ where: { id: filter.eventId } });
      filters.push(`Event: ${event ? pickLocaleText(event.title, 'en') || event.slug : `#${filter.eventId}`}`);
    }
    if (filter.status) filters.push(`Status: ${filter.status}`);
    if (filter.search) filters.push(`Search: "${filter.search}"`);

    const paidTotals: Record<string, number> = {};
    for (const o of items) {
      if (o.status !== OrderStatus.PAID) continue;
      const cur = this.mail.currencyLabel(o);
      paidTotals[cur] = (paidTotals[cur] ?? 0) + o.amount / 100;
    }

    return buildOrdersPdf({
      filters,
      paidTotals,
      orders: items.map((o) => ({
        reference: o.orderNumber,
        date: new Date(o.createdAt).toISOString().slice(0, 10),
        customer: [o.firstName, o.lastName].filter(Boolean).join(' ') || '—',
        email: o.email,
        phone: o.phone ?? '—',
        event: pickLocaleText(o.eventTitle, 'en') || o.eventSlug,
        guests: o.guests,
        amount: `${this.mail.currencyLabel(o)} ${this.mail.formatAmount(o)}`,
        status: o.status,
      })),
    });
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async checkout(dto: CheckoutDto, client = ''): Promise<{ orderNumber: string; formUrl?: string; redirectTo?: string }> {
    this.logger.log(`checkout start: slug=${dto.slug} guests=${dto.guests} email=${dto.email} locale=${dto.locale}`);
    const event = await this.eventRepo.findOne({ where: { slug: dto.slug } });
    if (!event) throw new NotFoundException(`Event "${dto.slug}" not found`);
    if (event.status !== EventStatus.ACTIVE) {
      throw new BadRequestException('This event is not open for booking');
    }
    const spotsLeft = event.maxCapacity - event.bookedCount;
    if (dto.guests > spotsLeft) {
      throw new BadRequestException('Not enough spots left for this event');
    }

    // Discount is always re-resolved server-side; the client only sends the code.
    if (dto.promoCode && !event.promoEnabled) {
      throw new BadRequestException('Promo codes are not accepted for this event');
    }
    const promo = dto.promoCode ? await this.promos.resolve(dto.promoCode, event.id, client) : null;
    const amount = this.computeAmount(event.price, dto.guests, promo?.discountPercent);
    // ARCA/EPG requires orderNumber ≤ 32 chars and rejects hyphens ("Order number
    // is invalid", errorCode=1). A hyphenated UUID is 36 chars; strip the hyphens
    // to get a unique 32-char alphanumeric value used consistently everywhere.
    const orderNumber = randomUUID().replace(/-/g, '');
    const currency = this.epgConfig.currency;

    const base = this.orderRepo.create({
      orderNumber,
      eventId: event.id,
      eventSlug: event.slug,
      eventTitle: event.title,
      firstName: dto.firstName,
      lastName: dto.lastName ?? null,
      email: dto.email,
      phone: dto.phone ?? null,
      notes: dto.notes ?? null,
      guests: dto.guests,
      guestDetails: dto.guestDetails ?? null,
      amount,
      currency,
      promoCode: promo?.code ?? null,
      discountPercent: promo?.discountPercent ?? null,
      status: OrderStatus.PENDING,
    });

    // Saved before the gateway call so a limited promo's use is held while the customer pays.
    const saved = promo?.maxUses != null ? await this.reservePromoUse(base, promo) : await this.orderRepo.save(base);

    // Free event: no gateway round-trip.
    if (amount === 0) {
      await this.markPaid(saved.id);
      const redirectTo = `/${dto.locale}/events/${event.slug}/confirmed?orderNumber=${orderNumber}`;
      return { orderNumber, redirectTo };
    }

    const returnUrl = this.buildReturnUrl(dto.locale, event.slug, orderNumber);
    this.logger.log(`checkout registering with EPG: orderNumber=${orderNumber} amount=${amount} currency=${currency}`);
    let registered: { orderId: string; formUrl: string };
    try {
      registered = await this.epg.register({
        orderNumber,
        amount,
        currency,
        returnUrl,
        failUrl: returnUrl,
        description: event.title?.en ?? event.slug,
      });
    } catch (e) {
      // Gateway never saw this order; drop it so it doesn't hold a promo use.
      await this.orderRepo.delete(saved.id);
      throw e;
    }
    const { orderId, formUrl } = registered;

    saved.epgOrderId = orderId;
    saved.epgFormUrl = formUrl;
    await this.orderRepo.save(saved);
    this.logger.log(`checkout done: orderNumber=${orderNumber} epgOrderId=${orderId} formUrl=${formUrl}`);
    return { orderNumber, formUrl };
  }

  async verify(orderNumber: string): Promise<OrderEntity> {
    const order = await this.findByOrderNumber(orderNumber);

    const terminal: OrderStatus[] = [
      OrderStatus.PAID, OrderStatus.REVERSED, OrderStatus.REFUNDED, OrderStatus.FAILED,
    ];
    if (terminal.includes(order.status) || !order.epgOrderId) {
      return order;
    }

    const st = await this.epg.getOrderStatusExtended(order.epgOrderId);
    const mapped = statusFromEpg(st.orderStatus);
    if (!mapped) return order; // unresolved; leave PENDING

    if (mapped === OrderStatus.PAID) {
      // All writes (gateway metadata + status + capacity) happen inside the
      // pessimistic-locked transaction in markPaid. Never persist the stale,
      // unlocked snapshot here — doing so could clobber a capacityApplied/status
      // already committed by a concurrent verify() and double-apply side effects.
      return this.markPaid(order.id, st);
    }

    // Non-PAID terminal/intermediate: targeted metadata + status update only.
    // A full-entity save of the stale snapshot is deliberately avoided.
    await this.orderRepo.update(order.id, {
      status: mapped,
      actionCode: st.actionCode,
      actionCodeDescription: st.actionCodeDescription,
      ...(st.panMasked ? { panMasked: st.panMasked } : {}),
    });
    return this.findById(order.id);
  }

  /**
   * Idempotently mark an order PAID and apply capacity + notifications exactly
   * once. When statusInfo is provided, the latest gateway metadata is persisted
   * inside the same locked transaction (never via a stale unlocked save).
   */
  private async markPaid(orderId: number, statusInfo?: EpgStatusResult): Promise<OrderEntity> {
    const applied = await this.orderRepo.manager.transaction(async (manager: EntityManager) => {
      // Lock the order row first (consistent order -> event lock ordering) so
      // concurrent verify() calls serialize instead of both reading
      // capacityApplied === false and double-applying capacity + emails.
      const order = await manager.findOne(OrderEntity, {
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException(`Order #${orderId} not found`);

      // Persist the latest gateway metadata under the lock in every case so it
      // is never lost, regardless of whether this call applies capacity.
      if (statusInfo) {
        order.actionCode = statusInfo.actionCode;
        order.actionCodeDescription = statusInfo.actionCodeDescription;
        if (statusInfo.panMasked) order.panMasked = statusInfo.panMasked;
      }

      if (order.capacityApplied) {
        await manager.save(order);
        return { order, justApplied: false };
      }

      const event = await manager.findOne(EventEntity, {
        where: { id: order.eventId },
        lock: { mode: 'pessimistic_write' },
      });
      if (event) {
        // Capture-then-refund model (no hard reservation): honor the captured
        // payment even if it oversells, but flag it so an admin can refund.
        if (event.bookedCount + order.guests > event.maxCapacity) {
          this.logger.warn(
            `Order ${order.orderNumber} oversold event #${event.id} ` +
              `(${event.bookedCount} + ${order.guests} > ${event.maxCapacity}); review for refund`,
          );
        }
        event.bookedCount = event.bookedCount + order.guests;
        await manager.save(event);
      }
      // ponytail: maxUses is checked at checkout, counted here; concurrent pending
      // orders can overshoot by a few (same capture-then-review model as capacity).
      if (order.promoCode) {
        await manager.increment(PromoCodeEntity, { code: order.promoCode }, 'usedCount', 1);
      }

      order.status = OrderStatus.PAID;
      order.capacityApplied = true;
      if (!order.paymentDate) order.paymentDate = new Date();
      await manager.save(order);
      return { order, justApplied: true };
    });

    if (applied.justApplied) {
      await this.mail.sendCustomerConfirmation(applied.order);
    }
    return applied.order;
  }

  async refund(id: number): Promise<OrderEntity> {
    return this.orderRepo.manager.transaction(async (manager: EntityManager) => {
      // Lock the order row first, then re-check status inside the transaction, so
      // two concurrent admin clicks can't both pass the check and both hit the
      // gateway. Order -> event lock ordering matches markPaid.
      const order = await manager.findOne(OrderEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException(`Order #${id} not found`);
      if (order.status !== OrderStatus.PAID) {
        throw new BadRequestException('Only paid orders can be refunded');
      }
      // Free orders never went through the gateway.
      if (order.amount > 0 && order.epgOrderId) {
        await this.epg.refund(order.epgOrderId, order.amount);
      }
      if (order.capacityApplied) {
        const event = await manager.findOne(EventEntity, {
          where: { id: order.eventId },
          lock: { mode: 'pessimistic_write' },
        });
        if (event) {
          event.bookedCount = Math.max(0, event.bookedCount - order.guests);
          await manager.save(event);
        }
        order.capacityApplied = false;
      }
      order.status = OrderStatus.REFUNDED;
      return manager.save(order);
    });
  }

  async reverse(id: number): Promise<OrderEntity> {
    return this.orderRepo.manager.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(OrderEntity, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!order) throw new NotFoundException(`Order #${id} not found`);
      if (order.status !== OrderStatus.PAID) {
        throw new BadRequestException('Only paid orders can be reversed');
      }
      if (order.epgOrderId) {
        await this.epg.reverse(order.epgOrderId);
      }
      if (order.capacityApplied) {
        const event = await manager.findOne(EventEntity, {
          where: { id: order.eventId },
          lock: { mode: 'pessimistic_write' },
        });
        if (event) {
          event.bookedCount = Math.max(0, event.bookedCount - order.guests);
          await manager.save(event);
        }
        order.capacityApplied = false;
      }
      order.status = OrderStatus.REVERSED;
      return manager.save(order);
    });
  }

  async paginate(options: IPaginationDTO<OrderEntity>): Promise<IPaginationData<OrderEntity>> {
    const qb = this.orderRepo.createQueryBuilder('order');

    const filter = options.filter as { status?: string; eventId?: number; search?: string } | undefined;
    if (filter?.status) qb.andWhere('order.status = :status', { status: filter.status });
    if (filter?.eventId) qb.andWhere('order.eventId = :eventId', { eventId: filter.eventId });
    if (filter?.search) {
      // Matches email, order number, phone, first/last name, or "First Last" typed together.
      qb.andWhere(
        `(order.email ILIKE :s OR order.orderNumber ILIKE :s OR order.phone ILIKE :s
          OR order.firstName ILIKE :s OR order.lastName ILIKE :s
          OR CONCAT_WS(' ', order.firstName, order.lastName) ILIKE :s)`,
        { s: `%${filter.search.trim()}%` },
      );
    }

    qb.orderBy('order.createdAt', (options.order as 'ASC' | 'DESC') ?? 'DESC')
      .skip(options.offset)
      .take(options.limit);

    const [items, count] = await qb.getManyAndCount();
    return { items, count };
  }
}

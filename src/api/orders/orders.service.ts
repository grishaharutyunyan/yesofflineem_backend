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
import { EpgService, EpgStatusResult, statusFromEpg } from './epg.service';
import { OrdersMailService } from './orders-mail.service';
import { CheckoutDto } from './dto/checkout.dto';
import { IPaginationData, IPaginationDTO } from '../../constants/interfaces/pagination.interfaces';

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
  ) {}

  private get epgConfig(): EpgConfig {
    return this.config.get<EpgConfig>('epg');
  }

  computeAmount(price: number, guests: number): number {
    return price * guests * this.epgConfig.amountMultiplier;
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

  async findByOrderNumber(orderNumber: string): Promise<OrderEntity> {
    const order = await this.orderRepo.findOne({ where: { orderNumber } });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async checkout(dto: CheckoutDto): Promise<{ orderNumber: string; formUrl?: string; redirectTo?: string }> {
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

    const amount = this.computeAmount(event.price, dto.guests);
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
      status: OrderStatus.PENDING,
    });

    // Free event: no gateway round-trip.
    if (amount === 0) {
      const saved = await this.orderRepo.save(base);
      await this.markPaid(saved.id);
      const redirectTo = `/${dto.locale}/events/${event.slug}/confirmed?orderNumber=${orderNumber}`;
      return { orderNumber, redirectTo };
    }

    const returnUrl = this.buildReturnUrl(dto.locale, event.slug, orderNumber);
    this.logger.log(`checkout registering with EPG: orderNumber=${orderNumber} amount=${amount} currency=${currency}`);
    const { orderId, formUrl } = await this.epg.register({
      orderNumber,
      amount,
      currency,
      returnUrl,
      failUrl: returnUrl,
      description: event.title?.en ?? event.slug,
    });

    base.epgOrderId = orderId;
    base.epgFormUrl = formUrl;
    await this.orderRepo.save(base);
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
      qb.andWhere('(order.email ILIKE :s OR order.orderNumber ILIKE :s)', { s: `%${filter.search}%` });
    }

    qb.orderBy('order.createdAt', (options.order as 'ASC' | 'DESC') ?? 'DESC')
      .skip(options.offset)
      .take(options.limit);

    const [items, count] = await qb.getManyAndCount();
    return { items, count };
  }
}

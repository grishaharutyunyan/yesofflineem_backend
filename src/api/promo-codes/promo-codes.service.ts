import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, QueryFailedError, Repository } from 'typeorm';
import { PromoCodeEntity } from './promo-code.entity';
import { CreatePromoCodeDto } from './dto/promo-code.dto';

/** Same message for every failure reason so codes can't be probed for state. */
export const INVALID_PROMO = 'Invalid or expired promo code';

export function isPromoUsable(p: PromoCodeEntity, eventId: number, now = new Date()): boolean {
  return (
    p.active &&
    (p.eventId == null || p.eventId === eventId) &&
    (!p.validFrom || p.validFrom <= now) &&
    (!p.validUntil || p.validUntil >= now) &&
    (p.maxUses == null || p.usedCount < p.maxUses)
  );
}

/** Discounted price in whole major units (AMD), so the frontend preview matches exactly. */
export function applyDiscount(majorAmount: number, percent: number): number {
  return Math.round((majorAmount * (100 - percent)) / 100);
}

/** Order total in AMD: a single-guest code discounts one ticket, the rest pay full price. */
export function discountedTotal(price: number, guests: number, promo?: { discountPercent: number; singleGuest: boolean } | null): number {
  if (!promo) return price * guests;
  if (promo.singleGuest) return applyDiscount(price, promo.discountPercent) + price * (guests - 1);
  return applyDiscount(price * guests, promo.discountPercent);
}

const MAX_FAILS = 10;
// Site-wide cap: per-client keys come from spoofable headers, so a script rotating
// fake IPs still hits this. Real users mistyping won't get near it.
const MAX_GLOBAL_FAILS = 200;
const FAIL_WINDOW_MS = 15 * 60 * 1000;

@Injectable()
export class PromoCodesService {
  // ponytail: in-memory per-client failure counter; move to Redis if the backend runs >1 instance.
  private readonly fails = new Map<string, { count: number; resetAt: number }>();
  private globalFails = { count: 0, resetAt: 0 };

  constructor(
    @InjectRepository(PromoCodeEntity)
    private readonly repo: Repository<PromoCodeEntity>,
  ) {}

  /** Whether any code can currently be used for this event; drives the booking page's promo field. */
  async hasUsable(eventId: number): Promise<boolean> {
    const candidates = await this.repo.find({
      where: [{ active: true, eventId }, { active: true, eventId: IsNull() }],
    });
    return candidates.some((p) => isPromoUsable(p, eventId));
  }

  findAll(): Promise<PromoCodeEntity[]> {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async create(dto: CreatePromoCodeDto): Promise<PromoCodeEntity> {
    if (dto.validUntil && new Date(dto.validUntil) <= new Date()) {
      throw new BadRequestException('validUntil must be in the future');
    }
    if (dto.validFrom && dto.validUntil && new Date(dto.validUntil) <= new Date(dto.validFrom)) {
      throw new BadRequestException('validUntil must be after validFrom');
    }
    try {
      return await this.repo.save(this.repo.create({
        code: dto.code,
        eventId: dto.eventId ?? null,
        discountPercent: dto.discountPercent,
        singleGuest: dto.singleGuest ?? true,
        maxUses: dto.maxUses ?? null,
        validFrom: dto.validFrom ? new Date(dto.validFrom) : null,
        validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
        active: dto.active ?? true,
      }));
    } catch (e) {
      if (e instanceof QueryFailedError && (e as any).driverError?.code === '23505') {
        throw new ConflictException('A promo code with this name already exists');
      }
      throw e;
    }
  }

  async setActive(id: number, active: boolean): Promise<PromoCodeEntity> {
    const promo = await this.repo.findOne({ where: { id } });
    if (!promo) throw new NotFoundException(`Promo code #${id} not found`);
    promo.active = active;
    return this.repo.save(promo);
  }

  async remove(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  /**
   * Returns the promo if usable for this event, else throws a generic 400.
   * `client` (IP) throttles repeated failures to stop brute-forcing codes.
   */
  async resolve(code: string, eventId: number, client: string): Promise<PromoCodeEntity> {
    const now = Date.now();
    const entry = this.fails.get(client);
    if (this.globalFails.resetAt <= now) this.globalFails = { count: 0, resetAt: now + FAIL_WINDOW_MS };
    if (this.globalFails.count >= MAX_GLOBAL_FAILS || (entry && entry.resetAt > now && entry.count >= MAX_FAILS)) {
      throw new HttpException('Too many attempts. Try again later.', HttpStatus.TOO_MANY_REQUESTS);
    }

    const promo = await this.repo.findOne({ where: { code: code.trim().toUpperCase() } });
    if (promo && isPromoUsable(promo, eventId)) return promo;

    this.globalFails.count++;
    const fresh = !entry || entry.resetAt <= now;
    this.fails.set(client, fresh ? { count: 1, resetAt: now + FAIL_WINDOW_MS } : { ...entry, count: entry.count + 1 });
    throw new BadRequestException(INVALID_PROMO);
  }
}
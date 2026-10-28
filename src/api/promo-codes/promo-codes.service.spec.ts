import { BadRequestException, HttpException } from '@nestjs/common';
import { PromoCodesService, applyDiscount, isPromoUsable } from './promo-codes.service';

const base = {
  id: 1, code: 'SAVE10', eventId: null, discountPercent: 10, maxUses: null, usedCount: 0,
  validFrom: null, validUntil: null, active: true,
} as any;

describe('promo codes', () => {
  it('applyDiscount rounds to whole units', () => {
    expect(applyDiscount(10000, 10)).toBe(9000);
    expect(applyDiscount(9999, 15)).toBe(8499);
    expect(applyDiscount(5000, 100)).toBe(0);
  });

  it('isPromoUsable checks active, event, dates and uses', () => {
    const now = new Date('2026-06-01');
    expect(isPromoUsable(base, 7, now)).toBe(true);
    expect(isPromoUsable({ ...base, active: false }, 7, now)).toBe(false);
    expect(isPromoUsable({ ...base, eventId: 8 }, 7, now)).toBe(false);
    expect(isPromoUsable({ ...base, eventId: 7 }, 7, now)).toBe(true);
    expect(isPromoUsable({ ...base, validUntil: new Date('2026-05-31') }, 7, now)).toBe(false);
    expect(isPromoUsable({ ...base, validFrom: new Date('2026-06-02') }, 7, now)).toBe(false);
    expect(isPromoUsable({ ...base, maxUses: 2, usedCount: 2 }, 7, now)).toBe(false);
  });

  it('hasUsable ignores expired or used-up candidates', async () => {
    const repo = { find: jest.fn(async () => [{ ...base, maxUses: 1, usedCount: 1 }]) };
    const svc = new PromoCodesService(repo as any);
    expect(await svc.hasUsable(7)).toBe(false);
    repo.find.mockResolvedValueOnce([{ ...base, maxUses: 1, usedCount: 1 }, base]);
    expect(await svc.hasUsable(7)).toBe(true);
  });

  it('create rejects past or inverted validity windows', async () => {
    const repo = { create: jest.fn((x) => x), save: jest.fn(async (x) => x) };
    const svc = new PromoCodesService(repo as any);
    const hour = (h: number) => new Date(Date.now() + h * 3600000).toISOString();
    const dto = { code: 'X10', discountPercent: 10 };
    await expect(svc.create({ ...dto, validUntil: hour(-1) })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.create({ ...dto, validFrom: hour(5), validUntil: hour(2) })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.create({ ...dto, validFrom: hour(0), validUntil: hour(24) })).resolves.toBeTruthy();
  });

  it('resolve blocks everyone after too many failures from rotating clients', async () => {
    const repo = { findOne: jest.fn(async ({ where }) => (where.code === 'SAVE10' ? base : null)) };
    const svc = new PromoCodesService(repo as any);
    for (let i = 0; i < 200; i++) await expect(svc.resolve('NOPE', 7, `fake-ip-${i}`)).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.resolve('SAVE10', 7, 'new-ip')).rejects.toBeInstanceOf(HttpException);
  });

  it('resolve normalizes case and throttles repeated failures', async () => {
    const repo = { findOne: jest.fn(async ({ where }) => (where.code === 'SAVE10' ? base : null)) };
    const svc = new PromoCodesService(repo as any);
    await expect(svc.resolve(' save10 ', 7, 'ip')).resolves.toBe(base);
    for (let i = 0; i < 10; i++) await expect(svc.resolve('NOPE', 7, 'ip')).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.resolve('SAVE10', 7, 'ip')).rejects.toBeInstanceOf(HttpException);
    await expect(svc.resolve('SAVE10', 7, 'other-ip')).resolves.toBe(base);
  });
});

import { Body, Controller, Get, Post, Query, Req } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { CheckPromoCodeDto } from '../promo-codes/dto/promo-code.dto';

// Requests arrive via the Next.js /api rewrite, so the real client is the first X-Forwarded-For hop.
const clientKey = (req: Request) =>
  String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim() || req.ip || '';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto, @Req() req: Request) {
    return this.orders.checkout(dto, clientKey(req));
  }

  @Post('promo')
  checkPromo(@Body() dto: CheckPromoCodeDto, @Req() req: Request) {
    return this.orders.checkPromo(dto.slug, dto.code, clientKey(req));
  }

  @Get('status')
  async status(@Query('orderNumber') orderNumber: string) {
    const order = await this.orders.verify(orderNumber);
    return {
      status: order.status,
      eventSlug: order.eventSlug,
      guests: order.guests,
      amount: order.amount,
      currency: order.currency,
    };
  }

  // Optional EPG server-to-server notification. Payload is NOT trusted;
  // status is re-verified via getOrderStatusExtended inside verify().
  @Post('callback')
  async callback(@Query('orderNumber') qNumber: string, @Body() body: { orderNumber?: string }) {
    const orderNumber = qNumber ?? body?.orderNumber;
    if (orderNumber) await this.orders.verify(orderNumber);
    return { ok: true };
  }
}

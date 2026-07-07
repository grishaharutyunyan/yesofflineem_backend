import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly orders: OrdersService) {}

  @Post('checkout')
  checkout(@Body() dto: CheckoutDto) {
    return this.orders.checkout(dto);
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

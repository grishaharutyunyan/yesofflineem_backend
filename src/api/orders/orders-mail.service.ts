import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OrderEntity } from './order.entity';

@Injectable()
export class OrdersMailService {
  private readonly logger = new Logger(OrdersMailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly adminEmail: string;

  constructor(config: ConfigService) {
    this.fromEmail = config.get<string>('smtp.user');
    this.adminEmail = config.get<string>('smtp.contactToEmail');
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('smtp.host'),
      port: config.get<number>('smtp.port'),
      secure: config.get<boolean>('smtp.secure'),
      auth: { user: this.fromEmail, pass: config.get<string>('smtp.pass') },
    });
  }

  private formatAmount(order: OrderEntity): string {
    return (order.amount / 100).toLocaleString();
  }

  async sendCustomerConfirmation(order: OrderEntity): Promise<void> {
    const title = order.eventTitle?.en ?? order.eventSlug;
    try {
      await this.transporter.sendMail({
        from: `<${this.fromEmail}>`,
        to: order.email,
        subject: `Booking confirmed — ${title}`,
        html: `
          <p>Hi ${order.firstName},</p>
          <p>Your booking for <strong>${title}</strong> is confirmed.</p>
          <p><strong>Guests:</strong> ${order.guests}<br/>
             <strong>Amount:</strong> ${order.currency} ${this.formatAmount(order)}<br/>
             <strong>Order:</strong> ${order.orderNumber}</p>
          <p>See you there.</p>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send customer confirmation for ${order.orderNumber}`, err as Error);
    }
  }

  async sendAdminNotification(order: OrderEntity): Promise<void> {
    const title = order.eventTitle?.en ?? order.eventSlug;
    try {
      await this.transporter.sendMail({
        from: `<${this.fromEmail}>`,
        to: this.adminEmail,
        subject: `New paid order — ${title}`,
        html: `
          <p><strong>New paid order</strong></p>
          <p><strong>Event:</strong> ${title}<br/>
             <strong>Customer:</strong> ${order.firstName} ${order.lastName ?? ''} (${order.email})<br/>
             <strong>Guests:</strong> ${order.guests}<br/>
             <strong>Amount:</strong> ${order.currency} ${this.formatAmount(order)}<br/>
             <strong>Order:</strong> ${order.orderNumber}</p>`,
      });
    } catch (err) {
      this.logger.error(`Failed to send admin notification for ${order.orderNumber}`, err as Error);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OrderEntity } from './order.entity';

interface DetailRow {
  label: string;
  value: string;
}

// Font stacks mirror the app: Cormorant Garamond for headings, DM Sans for UI.
// Both fall back to web-safe families for clients that strip web fonts (Gmail).
const SERIF = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const SANS = "'DM Sans', 'Helvetica Neue', Arial, sans-serif";

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

  // Maps ISO 4217 numeric currency codes (as stored by the gateway) to their
  // display code. Falls back to the raw stored value for anything unmapped.
  private static readonly CURRENCY_LABELS: Record<string, string> = {
    '051': 'AMD',
  };

  private currencyLabel(order: OrderEntity): string {
    return OrdersMailService.CURRENCY_LABELS[order.currency] ?? order.currency;
  }

  private formatAmount(order: OrderEntity): string {
    return (order.amount / 100).toLocaleString();
  }

  // ── Branded building blocks ────────────────────────────────────────────────

  /** The "yesofflineem" wordmark, recreated with styled text (app brand). */
  private logo(): string {
    return `
      <span style="font-family:${SANS};font-size:24px;letter-spacing:0.01em;color:#0a0a0a;">
        <span style="font-weight:300;">yes</span><span style="font-weight:700;">offline</span><span style="font-weight:300;font-style:italic;color:#888888;">em</span>
      </span>`;
  }

  private paragraph(text: string): string {
    return `<p style="margin:0 0 15px;font-family:${SANS};font-size:15px;line-height:1.7;color:#4a4a4a;">${text}</p>`;
  }

  private sectionLabel(text: string): string {
    return `<p style="margin:26px 0 10px;font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:#888888;">${text}</p>`;
  }

  /** A label/value detail table styled like the app's summary rows. */
  private detailsTable(rows: DetailRow[]): string {
    const body = rows
      .map(
        (r) => `
        <tr>
          <td style="padding:11px 0;border-bottom:1px solid #f0f0f0;font-family:${SANS};font-size:13px;color:#888888;vertical-align:top;">${r.label}</td>
          <td align="right" style="padding:11px 0;border-bottom:1px solid #f0f0f0;font-family:${SANS};font-size:14px;font-weight:600;color:#0a0a0a;vertical-align:top;">${r.value}</td>
        </tr>`,
      )
      .join('');
    return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #e8e8e8;margin-top:4px;">${body}</table>`;
  }

  /**
   * Renders the additional guests (everyone beyond the primary booker) as an
   * app-styled block, or an empty string when there are none.
   */
  private guestBlock(order: OrderEntity): string {
    const guests = order.guestDetails ?? [];
    if (guests.length === 0) return '';
    const rows: DetailRow[] = guests.map((g, i) => ({
      label: `Guest ${i + 2}`,
      value:
        `${g.firstName} ${g.lastName ?? ''}`.trim() +
        (g.phone ? `<br/><span style="font-weight:400;color:#888888;font-size:13px;">${g.phone}</span>` : ''),
    }));
    return this.sectionLabel('Additional guests') + this.detailsTable(rows);
  }

  /** Wraps content in the branded email shell (header logo, card, footer). */
  private layout(preheader: string, heading: string, inner: string): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,600;0,700&display=swap');
    body { margin:0; padding:0; background:#f2f1ed; -webkit-text-size-adjust:100%; }
  </style>
</head>
<body style="margin:0;padding:0;background:#f2f1ed;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#f2f1ed;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ed;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px;max-width:600px;background:#ffffff;border:1px solid #e6e4de;">
          <tr>
            <td align="center" style="padding:34px 40px 26px;border-bottom:1px solid #ececec;">
              ${this.logo()}
            </td>
          </tr>
          <tr>
            <td style="padding:38px 40px 40px;">
              <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:30px;font-weight:500;color:#0a0a0a;letter-spacing:-0.01em;line-height:1.15;">${heading}</h1>
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:22px 40px;background:#fafafa;border-top:1px solid #ececec;">
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:#999999;">
                <span style="color:#0a0a0a;font-weight:600;">yes</span><span style="color:#0a0a0a;font-weight:700;">offline</span><span style="color:#888888;font-style:italic;">em</span>
                &nbsp;·&nbsp; You received this email because a reservation was made with this address.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  // ── Emails ─────────────────────────────────────────────────────────────────

  async sendCustomerConfirmation(order: OrderEntity): Promise<void> {
    const title = order.eventTitle?.en ?? order.eventSlug;
    const inner =
      this.paragraph(`Hi ${order.firstName},`) +
      this.paragraph(`Your reservation for <strong style="color:#0a0a0a;">${title}</strong> is confirmed. We can't wait to see you there.`) +
      this.sectionLabel('Reservation summary') +
      this.detailsTable([
        { label: 'Guests', value: String(order.guests) },
        { label: 'Amount', value: `${this.currencyLabel(order)} ${this.formatAmount(order)}` },
        { label: 'Reference', value: order.orderNumber },
      ]) +
      this.guestBlock(order);
    try {
      await this.transporter.sendMail({
        from: `<${this.fromEmail}>`,
        to: order.email,
        subject: `Booking confirmed — ${title}`,
        html: this.layout(`Your reservation for ${title} is confirmed.`, "You're booked", inner),
      });
    } catch (err) {
      this.logger.error(`Failed to send customer confirmation for ${order.orderNumber}`, err as Error);
    }
  }

  async sendAdminNotification(order: OrderEntity): Promise<void> {
    const title = order.eventTitle?.en ?? order.eventSlug;
    const inner =
      this.paragraph('A new paid order has come in.') +
      this.detailsTable([
        { label: 'Event', value: title },
        { label: 'Customer', value: `${order.firstName} ${order.lastName ?? ''}`.trim() },
        { label: 'Email', value: order.email },
        { label: 'Phone', value: order.phone ?? '—' },
        { label: 'Guests', value: String(order.guests) },
        { label: 'Amount', value: `${this.currencyLabel(order)} ${this.formatAmount(order)}` },
        { label: 'Reference', value: order.orderNumber },
      ]) +
      this.guestBlock(order);
    try {
      await this.transporter.sendMail({
        from: `<${this.fromEmail}>`,
        to: this.adminEmail,
        subject: `New paid order — ${title}`,
        html: this.layout(`New paid order — ${title}`, 'New paid order', inner),
      });
    } catch (err) {
      this.logger.error(`Failed to send admin notification for ${order.orderNumber}`, err as Error);
    }
  }
}

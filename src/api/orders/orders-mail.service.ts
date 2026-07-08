import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrderEntity } from './order.entity';
import { EventEntity } from '../events/event.entity';
import { pickLocaleText } from '../events/event-i18n.types';
import { MailService } from '../../mail/mail.service';

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
  private readonly frontendUrl: string;

  constructor(
    private readonly mail: MailService,
    config: ConfigService,
    @InjectRepository(EventEntity)
    private readonly eventRepo: Repository<EventEntity>,
  ) {
    this.frontendUrl = (config.get<string>('frontendUrl') ?? '').replace(/\/$/, '');
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

  // ── Event date / place, links & attachments ────────────────────────────────

  /**
   * Splits 'YYYY-MM-DD' or 'YYYY-MM-DD HH:mm' into a calendar-basic stamp
   * (e.g. 20260712T190000 for timed, 20260712 for all-day) without any timezone
   * conversion — the stored wall-clock time is preserved as "floating" time.
   */
  private calStamp(value: string | undefined): { stamp: string; dateOnly: boolean } {
    const m = (value ?? '').match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) return { stamp: '', dateOnly: true };
    const [, y, mo, d, h, mi] = m;
    if (h == null) return { stamp: `${y}${mo}${d}`, dateOnly: true };
    return { stamp: `${y}${mo}${d}T${h}${mi}00`, dateOnly: false };
  }

  /** Human "when", e.g. "Sat, 12 Jul 2026 · 19:00" (or date-only). */
  private formatEventWhen(event: EventEntity): string {
    const raw = event.dates?.start;
    const m = (raw ?? '').match(/(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
    if (!m) return raw ?? '';
    const [, y, mo, d, hh, mm] = m;
    const date = new Intl.DateTimeFormat('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
    }).format(new Date(Date.UTC(+y, +mo - 1, +d)));
    return hh ? `${date} · ${hh}:${mm}` : date;
  }

  private locationText(event: EventEntity): string {
    const name = pickLocaleText(event.location, 'en');
    const address = pickLocaleText(event.coordinates?.address, 'en');
    return [name, address].filter(Boolean).join(' — ');
  }

  /** A bordered "when & where" box with icons. */
  private eventDetailsBlock(event: EventEntity): string {
    const when = this.formatEventWhen(event);
    const where = this.locationText(event);
    if (!when && !where) return '';
    const row = (icon: string, label: string, value: string) =>
      value
        ? `<tr>
             <td style="padding:12px 0;width:34px;font-size:17px;vertical-align:top;">${icon}</td>
             <td style="padding:12px 0;vertical-align:top;">
               <div style="font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:#888888;">${label}</div>
               <div style="font-family:${SANS};font-size:15px;color:#0a0a0a;margin-top:3px;line-height:1.5;">${value}</div>
             </td>
           </tr>`
        : '';
    return `
      <div style="border:1px solid #e6e4de;background:#fbfbf9;padding:6px 20px;margin:22px 0 4px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
          ${row('📅', 'When', when)}
          ${row('📍', 'Where', where)}
        </table>
      </div>`;
  }

  private googleCalUrl(event: EventEntity, order: OrderEntity, title: string): string {
    const start = this.calStamp(event.dates?.start);
    const end = this.calStamp(event.dates?.end);
    const dates = `${start.stamp}/${end.stamp || start.stamp}`;
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: title,
      dates,
      location: this.locationText(event),
      details: `Booking reference: ${order.orderNumber} · Guests: ${order.guests}`,
    });
    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  }

  private mapsUrl(event: EventEntity): string {
    const c = event.coordinates;
    if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
      return `https://www.google.com/maps/search/?api=1&query=${c.lat},${c.lng}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(this.locationText(event))}`;
  }

  /** The confirmation page where the customer's ticket/booking lives. */
  private ticketUrl(order: OrderEntity): string {
    return `${this.frontendUrl}/en/events/${order.eventSlug}/confirmed?orderNumber=${encodeURIComponent(order.orderNumber)}`;
  }

  private button(href: string, label: string, primary: boolean): string {
    const bg = primary ? '#2d2d2d' : '#ffffff';
    const color = primary ? '#ffffff' : '#2d2d2d';
    return `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 10px;">
        <tr><td align="center" style="border:1px solid #2d2d2d;background:${bg};">
          <a href="${href}" target="_blank" style="display:block;padding:13px 20px;font-family:${SANS};font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;text-decoration:none;color:${color};">${label}</a>
        </td></tr>
      </table>`;
  }

  private actionsBlock(event: EventEntity, order: OrderEntity, title: string): string {
    return (
      this.sectionLabel('Before you go') +
      this.button(this.googleCalUrl(event, order, title), 'Add to calendar', true) +
      this.button(this.mapsUrl(event), 'See map', false) +
      this.button(this.ticketUrl(order), 'Download ticket', false) +
      `<p style="margin:8px 0 0;font-family:${SANS};font-size:12px;color:#999999;line-height:1.6;">Your ticket and a calendar invite are also attached to this email.</p>`
    );
  }

  private icsEscape(text: string): string {
    return (text ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
  }

  private nowUtcStamp(): string {
    return new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  }

  private plusOneDay(dateStamp: string): string {
    const y = +dateStamp.slice(0, 4), mo = +dateStamp.slice(4, 6) - 1, d = +dateStamp.slice(6, 8);
    const dt = new Date(Date.UTC(y, mo, d + 1));
    const p = (n: number) => String(n).padStart(2, '0');
    return `${dt.getUTCFullYear()}${p(dt.getUTCMonth() + 1)}${p(dt.getUTCDate())}`;
  }

  /** A minimal RFC-5545 calendar invite (floating local time). */
  private buildIcs(event: EventEntity, order: OrderEntity, title: string): string {
    const start = this.calStamp(event.dates?.start);
    const end = this.calStamp(event.dates?.end);
    const dtStart = start.dateOnly ? `DTSTART;VALUE=DATE:${start.stamp}` : `DTSTART:${start.stamp}`;
    const endStamp = start.dateOnly
      ? this.plusOneDay(end.stamp || start.stamp)
      : end.stamp || start.stamp;
    const dtEnd = start.dateOnly ? `DTEND;VALUE=DATE:${endStamp}` : `DTEND:${endStamp}`;
    return [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//yesofflineem//booking//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${order.orderNumber}@yesofflineem`,
      `DTSTAMP:${this.nowUtcStamp()}`,
      dtStart,
      dtEnd,
      `SUMMARY:${this.icsEscape(title)}`,
      `LOCATION:${this.icsEscape(this.locationText(event))}`,
      `DESCRIPTION:${this.icsEscape(`Booking reference: ${order.orderNumber} · Guests: ${order.guests}`)}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');
  }

  /** A self-contained, printable branded ticket (delivered as an attachment). */
  private buildTicketHtml(order: OrderEntity, event: EventEntity | null, title: string): string {
    const when = event ? this.formatEventWhen(event) : '';
    const where = event ? this.locationText(event) : '';
    const guestName = `${order.firstName} ${order.lastName ?? ''}`.trim();
    const line = (label: string, value: string) =>
      value
        ? `<tr>
             <td style="padding:9px 0;border-bottom:1px solid #eee;font-family:${SANS};font-size:12px;color:#888;">${label}</td>
             <td align="right" style="padding:9px 0;border-bottom:1px solid #eee;font-family:${SANS};font-size:14px;font-weight:600;color:#0a0a0a;">${value}</td>
           </tr>`
        : '';
    return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>Ticket — ${title}</title></head>
<body style="margin:0;background:#f2f1ed;font-family:${SANS};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:32px 16px;">
    <table role="presentation" width="440" cellpadding="0" cellspacing="0" style="width:440px;max-width:440px;background:#ffffff;border:1px solid #e6e4de;">
      <tr><td align="center" style="padding:28px 32px 20px;border-bottom:1px dashed #d8d6cf;">
        <span style="font-family:${SANS};font-size:22px;color:#0a0a0a;"><span style="font-weight:300;">yes</span><span style="font-weight:700;">offline</span><span style="font-weight:300;font-style:italic;color:#888;">em</span></span>
        <div style="font-family:${SANS};font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#888;margin-top:10px;">Admission ticket</div>
      </td></tr>
      <tr><td style="padding:26px 32px 30px;">
        <h1 style="margin:0 0 18px;font-family:${SERIF};font-size:26px;font-weight:500;color:#0a0a0a;line-height:1.15;">${title}</h1>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
          ${line('When', when)}
          ${line('Where', where)}
          ${line('Guest', guestName)}
          ${line('Guests', String(order.guests))}
          ${line('Reference', order.orderNumber)}
        </table>
        <div style="margin-top:22px;text-align:center;font-family:'Courier New',monospace;font-size:16px;letter-spacing:0.32em;color:#0a0a0a;background:#f5f4f0;padding:14px;border:1px solid #e6e4de;">${order.orderNumber}</div>
        <p style="margin:16px 0 0;font-family:${SANS};font-size:11px;color:#999;text-align:center;line-height:1.6;">Present this reference at the door. Print this page or save it as PDF.</p>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
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
    const event = await this.eventRepo
      .findOne({ where: { id: order.eventId } })
      .catch(() => null);

    const inner =
      this.paragraph(`Hi ${order.firstName},`) +
      this.paragraph(`Your reservation for <strong style="color:#0a0a0a;">${title}</strong> is confirmed. We can't wait to see you there.`) +
      (event ? this.eventDetailsBlock(event) : '') +
      this.sectionLabel('Reservation summary') +
      this.detailsTable([
        { label: 'Guests', value: String(order.guests) },
        { label: 'Amount', value: `${this.currencyLabel(order)} ${this.formatAmount(order)}` },
        { label: 'Reference', value: order.orderNumber },
      ]) +
      this.guestBlock(order) +
      (event ? this.actionsBlock(event, order, title) : '');

    const attachments: { filename: string; content: string; contentType: string }[] = [];
    if (event) {
      attachments.push({
        filename: 'add-to-calendar.ics',
        content: this.buildIcs(event, order, title),
        contentType: 'text/calendar; charset=utf-8; method=PUBLISH',
      });
    }
    attachments.push({
      filename: `ticket-${order.orderNumber}.html`,
      content: this.buildTicketHtml(order, event, title),
      contentType: 'text/html; charset=utf-8',
    });

    try {
      await this.mail.sendMail({
        to: order.email,
        subject: `Booking confirmed — ${title}`,
        html: this.layout(`Your reservation for ${title} is confirmed.`, "You're booked", inner),
        attachments,
      });
    } catch (err) {
      this.logger.error(`Failed to send customer confirmation for ${order.orderNumber}`, err as Error);
    }
  }
}

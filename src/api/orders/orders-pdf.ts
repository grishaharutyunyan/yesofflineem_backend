import { BORDER, FAINT, HEAD_BG, INK, MUTED, Weight, createPdf, measure, pageFooters, write } from './pdf-text';

export interface OrdersPdfInput {
  /** Human summary of the active filters, e.g. ["Event: Pottery Evening #1", "Status: paid"]. */
  filters: string[];
  orders: {
    reference: string;
    date: string;
    customer: string;
    email: string;
    phone: string;
    event: string;
    guests: number;
    amount: string;
    status: string;
  }[];
  /** Paid total per currency label, e.g. { AMD: 123000 }. */
  paidTotals: Record<string, number>;
}

const PAGE_W = 841.89; // A4 landscape
const PAGE_H = 595.28;
const M = 36;
const ROW_H = 30;
const COLS = [
  { key: 'idx', label: '#', w: 26 },
  { key: 'reference', label: 'ORDER', w: 70 },
  { key: 'date', label: 'DATE', w: 64 },
  { key: 'customer', label: 'CUSTOMER', w: 160 },
  { key: 'phone', label: 'PHONE', w: 92 },
  { key: 'event', label: 'EVENT', w: 170 },
  { key: 'guests', label: 'GUESTS', w: 44 },
  { key: 'amount', label: 'AMOUNT', w: 76 },
  { key: 'status', label: 'STATUS', w: 67.89 },
] as const;

const STATUS_COLOR: Record<string, string> = {
  paid: '#059669',
  pending: '#d97706',
  failed: '#dc2626',
};

/** Renders the (filtered) orders list as a printable landscape table. */
export function buildOrdersPdf(input: OrdersPdfInput): Promise<Buffer> {
  const { doc, done } = createPdf({ size: 'A4', layout: 'landscape', info: { Title: 'Orders' } });
  const contentW = PAGE_W - M * 2;

  // ── Header ──
  let y = M;
  write(doc, 'YESOFFLINEEM · ORDERS', M, y, 8, 'bold', FAINT);
  y += 16;
  write(doc, 'Orders', M, y, 20, 'bold', INK);
  const generated = `Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
  write(doc, generated, PAGE_W - M - measure(doc, generated, 8, 'regular'), y + 10, 8, 'regular', FAINT);
  y += 30;
  write(doc, input.filters.length ? `Filters: ${input.filters.join('   ·   ')}` : 'All orders (no filters)', M, y, 9.5, 'regular', MUTED, contentW);
  y += 16;
  const totals = Object.entries(input.paidTotals).map(([cur, v]) => `${cur} ${v.toLocaleString('en-US')}`).join(' + ') || '0';
  write(doc, `${input.orders.length} orders   ·   Paid total: ${totals}`, M, y, 10, 'bold', INK);
  y += 24;

  const drawHead = () => {
    doc.rect(M, y, contentW, 22).fill(HEAD_BG);
    let x = M;
    for (const c of COLS) {
      write(doc, c.label, x + 5, y + 7, 7, 'bold', MUTED);
      x += c.w;
    }
    doc.moveTo(M, y + 22).lineTo(M + contentW, y + 22).lineWidth(0.6).strokeColor(BORDER).stroke();
    y += 22;
  };

  drawHead();
  if (input.orders.length === 0) write(doc, 'No orders match these filters.', M + 5, y + 10, 10, 'regular', MUTED);

  input.orders.forEach((o, i) => {
    if (y + ROW_H > PAGE_H - M - 20) {
      doc.addPage();
      y = M;
      drawHead();
    }
    let x = M;
    for (const c of COLS) {
      const w = c.w - 10;
      if (c.key === 'customer') {
        // Name on top, email underneath.
        write(doc, o.customer, x + 5, y + 5, 8.5, 'bold', INK, w);
        write(doc, o.email, x + 5, y + 16, 7.5, 'regular', MUTED, w);
      } else if (c.key === 'status') {
        const color = STATUS_COLOR[o.status] ?? MUTED;
        doc.circle(x + 8, y + 15, 2.5).fill(color);
        write(doc, o.status.charAt(0).toUpperCase() + o.status.slice(1), x + 14, y + 10, 8.5, 'bold', color, w - 9);
      } else {
        const value = c.key === 'idx' ? String(i + 1) : String(o[c.key]);
        const weight: Weight = c.key === 'amount' ? 'bold' : 'regular';
        const color = c.key === 'idx' || c.key === 'reference' || c.key === 'date' ? MUTED : INK;
        write(doc, value, x + 5, y + 10, 8.5, weight, color, w);
      }
      x += c.w;
    }
    doc.moveTo(M, y + ROW_H).lineTo(M + contentW, y + ROW_H).lineWidth(0.4).strokeColor(BORDER).stroke();
    y += ROW_H;
  });

  pageFooters(doc, 'Orders', PAGE_W, PAGE_H, M);
  doc.end();
  return done;
}

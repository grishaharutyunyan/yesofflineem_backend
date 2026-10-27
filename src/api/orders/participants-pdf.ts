import { BORDER, FAINT, GUEST_BG, HEAD_BG, INK, MUTED, Weight, createPdf, measure, pageFooters, write } from './pdf-text';

export interface ParticipantsPdfInput {
  title: string;
  when: string;
  where: string;
  bookings: {
    name: string;
    phone: string;
    email: string;
    reference: string;
    guests: { name: string; phone: string }[];
  }[];
}

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const M = 40;
const ROW_H = 24;
const COLS = [
  { key: 'check', label: '', w: 22 },
  { key: 'idx', label: '#', w: 24 },
  { key: 'name', label: 'NAME', w: 145 },
  { key: 'phone', label: 'PHONE', w: 95 },
  { key: 'email', label: 'EMAIL', w: 127 },
  { key: 'people', label: 'PEOPLE', w: 34 },
  { key: 'ref', label: 'BOOKING', w: 68 },
] as const;

/** Renders a printable check-in list of paid bookings (and their guests) for one event. */
export function buildParticipantsPdf(input: ParticipantsPdfInput): Promise<Buffer> {
  const { doc, done } = createPdf({ size: 'A4', info: { Title: `Participants — ${input.title}` } });
  {

    const people = input.bookings.reduce((n, b) => n + 1 + b.guests.length, 0);
    const contentW = PAGE_W - M * 2;

    // ── Header ──
    let y = M;
    write(doc, 'YESOFFLINEEM · PARTICIPANTS LIST', M, y, 8, 'bold', FAINT);
    y += 18;
    write(doc, input.title, M, y, 20, 'bold', INK, contentW);
    y += 30;
    const meta = [input.when, input.where].filter(Boolean).join('   ·   ');
    if (meta) {
      write(doc, meta, M, y, 10, 'regular', MUTED, contentW);
      y += 18;
    }
    write(doc, `${input.bookings.length} bookings   ·   ${people} people   ·   paid only`, M, y, 10, 'bold', INK);
    const generated = `Generated ${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`;
    write(doc, generated, PAGE_W - M - measure(doc, generated, 8, 'regular'), y + 2, 8, 'regular', FAINT);
    y += 26;

    const drawHead = () => {
      doc.rect(M, y, contentW, ROW_H).fill(HEAD_BG);
      let x = M;
      for (const c of COLS) {
        if (c.label) write(doc, c.label, x + 4, y + 8, 7, 'bold', MUTED);
        x += c.w;
      }
      doc.moveTo(M, y + ROW_H).lineTo(M + contentW, y + ROW_H).lineWidth(0.6).strokeColor(BORDER).stroke();
      y += ROW_H;
    };

    const ensureRoom = () => {
      if (y + ROW_H > PAGE_H - M - 20) {
        doc.addPage();
        y = M;
        drawHead();
      }
    };

    const drawRow = (cells: Record<string, string>, opts: { guest: boolean }) => {
      ensureRoom();
      if (opts.guest) doc.rect(M, y, contentW, ROW_H).fill(GUEST_BG);
      let x = M;
      for (const c of COLS) {
        const ty = y + 7;
        if (c.key === 'check') {
          doc.lineWidth(0.8).strokeColor('#9ca3af').rect(x + 6, y + 7, 10, 10).stroke();
        } else {
          const text = cells[c.key] ?? '';
          const indent = opts.guest && c.key === 'name' ? 12 : 0;
          const weight: Weight = c.key === 'name' && !opts.guest ? 'bold' : 'regular';
          const color = c.key === 'idx' || c.key === 'ref' || opts.guest ? MUTED : INK;
          if (text) write(doc, text, x + 4 + indent, ty, 8.5, weight, color, c.w - 8 - indent);
        }
        x += c.w;
      }
      doc.moveTo(M, y + ROW_H).lineTo(M + contentW, y + ROW_H).lineWidth(0.4).strokeColor(BORDER).stroke();
      y += ROW_H;
    };

    drawHead();
    if (input.bookings.length === 0) {
      write(doc, 'No paid bookings yet.', M + 4, y + 10, 10, 'regular', MUTED);
    }
    input.bookings.forEach((b, i) => {
      drawRow({
        idx: String(i + 1),
        name: b.name,
        phone: b.phone,
        email: b.email,
        people: String(1 + b.guests.length),
        ref: b.reference.length > 10 ? b.reference.slice(0, 8) : b.reference,
      }, { guest: false });
      b.guests.forEach((g, gi) => {
        drawRow({ name: `› ${g.name}`, phone: g.phone, email: `Guest ${gi + 1} of ${b.name.split(' ')[0]}` }, { guest: true });
      });
    });

    pageFooters(doc, input.title, PAGE_W, PAGE_H, M);
    doc.end();
  }
  return done;
}

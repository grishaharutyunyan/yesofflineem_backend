// CommonJS import: the project's tsconfig has no `esModuleInterop`, so a
// default import would compile to `pdfkit.default` (undefined) and crash.
import PDFDocument = require('pdfkit');

export interface TicketPdfInput {
  title: string;
  when: string;
  where: string;
  guestName: string;
  guests: number;
  reference: string;
}

const INK = '#0a0a0a';
const MUTED = '#888888';
const BORDER = '#e6e4de';
const SOFT = '#f5f4f0';

const PAGE_W = 380;
const PAGE_H = 560;
const M = 34; // side margin
const CONTENT_W = PAGE_W - M * 2;

/** Renders a branded, printable admission ticket as a PDF buffer. */
export function buildTicketPdf(input: TicketPdfInput): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: 0 });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Outer frame
    doc.lineWidth(1).strokeColor(BORDER).rect(0.5, 0.5, PAGE_W - 1, PAGE_H - 1).stroke();

    // ── Header: wordmark + "admission ticket" ──
    let y = 44;
    drawWordmark(doc, PAGE_W / 2, y, 21);
    y += 34;
    doc
      .font('Helvetica')
      .fontSize(9)
      .fillColor(MUTED)
      .text('BOOKING CONFIRMATION', 0, y, { width: PAGE_W, align: 'center', characterSpacing: 3 });
    y += 26;

    // Dashed separator
    doc
      .moveTo(M, y)
      .lineTo(PAGE_W - M, y)
      .dash(2, { space: 3 })
      .strokeColor('#d8d6cf')
      .stroke()
      .undash();
    y += 26;

    // ── Event title ──
    doc.font('Helvetica-Bold').fontSize(21).fillColor(INK);
    doc.text(input.title, M, y, { width: CONTENT_W, align: 'left' });
    y = doc.y + 18;

    // ── Detail rows ──
    const rows: [string, string][] = [
      ['When', input.when],
      ['Where', input.where],
      ['Guest', input.guestName],
      ['Guests', String(input.guests)],
    ].filter(([, v]) => v) as [string, string][];

    for (const [label, value] of rows) {
      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(MUTED)
        .text(label.toUpperCase(), M, y, { width: CONTENT_W, characterSpacing: 1.2 });
      const valueY = doc.y + 2;
      doc.font('Helvetica-Bold').fontSize(12).fillColor(INK).text(value, M, valueY, { width: CONTENT_W });
      // thin divider under each row
      y = doc.y + 10;
      doc.moveTo(M, y).lineTo(PAGE_W - M, y).lineWidth(0.5).strokeColor('#eeece7').stroke();
      y += 12;
    }

    // ── Reference block ──
    y += 6;
    const boxH = 52;
    doc.rect(M, y, CONTENT_W, boxH).lineWidth(1).fillAndStroke(SOFT, BORDER);
    doc
      .font('Helvetica')
      .fontSize(7.5)
      .fillColor(MUTED)
      .text('REFERENCE', M, y + 11, { width: CONTENT_W, align: 'center', characterSpacing: 2 });
    doc
      .font('Courier-Bold')
      .fontSize(15)
      .fillColor(INK)
      .text(input.reference, M, y + 24, { width: CONTENT_W, align: 'center', characterSpacing: 2 });

    // ── Footer note ──
    doc
      .font('Helvetica')
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        'Present this reference at the door.',
        M,
        PAGE_H - 40,
        { width: CONTENT_W, align: 'center' },
      );

    doc.end();
  });
}

/** Draws the "yesofflineem" wordmark centered on `centerX`, using font weights. */
function drawWordmark(doc: PDFKit.PDFDocument, centerX: number, y: number, size: number): void {
  const parts: { t: string; font: string; color: string }[] = [
    { t: 'yes', font: 'Helvetica', color: INK },
    { t: 'offline', font: 'Helvetica-Bold', color: INK },
    { t: 'em', font: 'Helvetica-Oblique', color: MUTED },
  ];
  doc.fontSize(size);
  const widths = parts.map((p) => {
    doc.font(p.font);
    return doc.widthOfString(p.t);
  });
  const total = widths.reduce((a, b) => a + b, 0);
  let x = centerX - total / 2;
  parts.forEach((p, i) => {
    doc.font(p.font).fillColor(p.color).text(p.t, x, y, { lineBreak: false });
    x += widths[i];
  });
}

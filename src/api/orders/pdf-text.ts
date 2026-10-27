// Shared pdfkit text helpers: bundled Noto fonts and mixed Armenian/Latin text runs.
// CommonJS import: the project's tsconfig has no `esModuleInterop` (see ticket-pdf.ts).
import PDFDocument = require('pdfkit');
import { join } from 'path';

// assets/ sits at the backend root; this file is at src|dist/api/orders.
const FONT_DIR = join(__dirname, '..', '..', '..', 'assets', 'fonts');
const ARMENIAN = /[\u0530-\u058F\uFB13-\uFB17]+/g;

export const INK = '#111827';
export const MUTED = '#6b7280';
export const FAINT = '#9ca3af';
export const BORDER = '#e5e7eb';
export const HEAD_BG = '#f9fafb';
export const GUEST_BG = '#fbfbfc';

export type Weight = 'regular' | 'bold';
export type Doc = InstanceType<typeof PDFDocument>;

// Noto Sans has no Armenian and Noto Sans Armenian has no Latin, so text is drawn as per-script runs.
function runs(text: string): { text: string; armenian: boolean }[] {
  const out: { text: string; armenian: boolean }[] = [];
  let last = 0;
  for (const m of text.matchAll(ARMENIAN)) {
    if (m.index! > last) out.push({ text: text.slice(last, m.index), armenian: false });
    out.push({ text: m[0], armenian: true });
    last = m.index! + m[0].length;
  }
  if (last < text.length) out.push({ text: text.slice(last), armenian: false });
  return out;
}

function fontFor(armenian: boolean, weight: Weight): string {
  return `${armenian ? 'Arm' : 'Sans'}-${weight}`;
}

export function measure(doc: Doc, text: string, size: number, weight: Weight): number {
  return runs(text).reduce((w, r) => w + doc.font(fontFor(r.armenian, weight)).fontSize(size).widthOfString(r.text), 0);
}

/** Shortens text with "…" until it fits the given width. */
export function fit(doc: Doc, text: string, width: number, size: number, weight: Weight): string {
  if (measure(doc, text, size, weight) <= width) return text;
  let t = text;
  while (t.length > 1 && measure(doc, `${t}…`, size, weight) > width) t = t.slice(0, -1);
  return `${t.trimEnd()}…`;
}

/** Draws one line of mixed-script text at (x, y). */
export function write(doc: Doc, text: string, x: number, y: number, size: number, weight: Weight, color: string, width?: number) {
  const line = width ? fit(doc, text, width, size, weight) : text;
  let cx = x;
  doc.fillColor(color);
  for (const r of runs(line)) {
    doc.font(fontFor(r.armenian, weight)).fontSize(size).text(r.text, cx, y, { lineBreak: false });
    cx += doc.widthOfString(r.text);
  }
}

/** Writes a booking code in full: one line if it fits, otherwise split in half over two smaller lines. */
export function writeCode(doc: Doc, code: string, x: number, y: number, width: number, rowH: number, color: string) {
  if (measure(doc, code, 8.5, 'regular') <= width) {
    write(doc, code, x, y + rowH / 2 - 5, 8.5, 'regular', color);
    return;
  }
  const half = Math.ceil(code.length / 2);
  write(doc, code.slice(0, half), x, y + rowH / 2 - 9, 7, 'regular', color);
  write(doc, code.slice(half), x, y + rowH / 2 + 0.5, 7, 'regular', color);
}

/** Creates a document with the Noto fonts registered; `done` resolves with the PDF bytes after doc.end(). */
export function createPdf(options: PDFKit.PDFDocumentOptions): { doc: Doc; done: Promise<Buffer> } {
  const doc = new PDFDocument({ margin: 0, bufferPages: true, ...options });
  const done = new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
  doc.registerFont('Sans-regular', join(FONT_DIR, 'NotoSans-Regular.ttf'));
  doc.registerFont('Sans-bold', join(FONT_DIR, 'NotoSans-Bold.ttf'));
  doc.registerFont('Arm-regular', join(FONT_DIR, 'NotoSansArmenian-Regular.ttf'));
  doc.registerFont('Arm-bold', join(FONT_DIR, 'NotoSansArmenian-Bold.ttf'));
  return { doc, done };
}

/** Writes "title · Page x of y" in the bottom margin of every buffered page. */
export function pageFooters(doc: Doc, title: string, pageW: number, pageH: number, margin: number) {
  const range = doc.bufferedPageRange();
  for (let p = range.start; p < range.start + range.count; p++) {
    doc.switchToPage(p);
    const label = `Page ${p - range.start + 1} of ${range.count}`;
    write(doc, label, pageW - margin - measure(doc, label, 8, 'regular'), pageH - margin + 6, 8, 'regular', FAINT);
    write(doc, title, margin, pageH - margin + 6, 8, 'regular', FAINT, pageW - margin * 2 - 100);
  }
}

# PDF fonts

Used by `src/api/orders/participants-pdf.ts` (pdfkit's built-in Helvetica has no Armenian glyphs).

- `NotoSans-*` — Latin, Cyrillic, digits, punctuation
- `NotoSansArmenian-*` — Armenian (contains no Latin, so text is split into runs per script)

Source: https://github.com/notofonts/notofonts.github.io — licensed under the SIL Open Font License 1.1 (https://openfontlicense.org).

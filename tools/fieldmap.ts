/**
 * Field map — an annotation authoring aid.
 *
 * Reads a form PDF's AcroForm layer and stamps each input box's field id and
 * page onto the form, outlining the box. Open the resulting PDF to see which
 * opaque IRS field id (e.g. `f1_14`, `c1_8[0]`) lives in which labelled box,
 * then copy the id's coordinates into an annotation and give it a meaningful
 * name. This is the visual reference behind the manual labelling step
 * described in the README.
 *
 * Usage:
 *   npm run fieldmap -- <form.pdf> <out.pdf>
 *   e.g. npm run fieldmap -- forms/f1040.pdf out/f1040.fieldmap.pdf
 */
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readFileSync, writeFileSync } from "node:fs";
import { extractWidgets } from "../src/bootstrap";

export async function buildFieldMap(pdfBytes: Uint8Array): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const widgets = await extractWidgets(pdfBytes);

  for (const w of widgets) {
    const page = pages[w.page];
    if (!page) continue;
    const { x, y, w: width, h: height } = w.rect;
    // Outline the box (PDF-native bottom-left coords, same as our spec).
    page.drawRectangle({ x, y, width, height, borderColor: rgb(1, 0, 0), borderWidth: 0.4 });
    // Label with the short field id, bottom-left inside the box.
    const short = w.name.split(".").pop() ?? w.name;
    page.drawText(short, { x: x + 0.5, y: y + 1, size: 4.5, font, color: rgb(0, 0, 1) });
  }
  return doc.save();
}

// CLI: tsx tools/fieldmap.ts <form.pdf> <out.pdf>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [pdfPath, outPath] = process.argv.slice(2);
  if (!pdfPath || !outPath) {
    console.error("Usage: npm run fieldmap -- <form.pdf> <out.pdf>");
    process.exit(1);
  }
  const bytes = new Uint8Array(readFileSync(pdfPath));
  const out = await buildFieldMap(bytes);
  writeFileSync(outPath, out);
  console.log(`Wrote ${outPath}`);
}

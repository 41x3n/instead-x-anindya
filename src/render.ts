import { PDFDocument, StandardFonts, PDFPage } from "pdf-lib";
import type { AnnotationDoc } from "./types";
import { validateDoc } from "./validate";
import { metricsFor } from "./draw";
import { fieldRenderers, RenderContext } from "./fieldRenderers";

export { validateDoc } from "./validate";

// This module is browser-safe: no Node built-ins. The CLI lives in cli.ts.

/** Fail loud if the loaded PDF's pages don't match what the annotation was authored against. */
function assertPageSizes(annotation: AnnotationDoc, pages: PDFPage[]): void {
  for (const src of annotation.form.source.pages) {
    const p = pages[src.index];
    if (!p) {
      throw new Error(`Source declares page ${src.index} but PDF has ${pages.length} pages`);
    }
    const { width, height } = p.getSize();
    if (Math.abs(width - src.width) > 0.5 || Math.abs(height - src.height) > 0.5) {
      throw new Error(
        `Page ${src.index} size ${width}x${height} != source ${src.width}x${src.height}`,
      );
    }
  }
}

/**
 * Overlay a data set onto a form PDF according to an annotation.
 *
 * Pipeline: validate against the schema → assert page sizes → embed the font →
 * dispatch each field to its renderer in a single O(n) pass → return the bytes.
 */
export async function renderForm(opts: {
  annotation: AnnotationDoc;
  data: unknown;
  pdfBytes: Uint8Array;
}): Promise<Uint8Array> {
  const { annotation, data, pdfBytes } = opts;
  validateDoc(annotation);

  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  assertPageSizes(annotation, pages);

  const font = await doc.embedFont(StandardFonts.Helvetica);
  const metrics = metricsFor(font);
  const defaults = annotation.defaults ?? {};

  for (const field of annotation.fields) {
    const ctx: RenderContext = { page: pages[field.page], font, metrics, data, defaults };
    fieldRenderers[field.type](field, ctx);
  }

  return doc.save();
}

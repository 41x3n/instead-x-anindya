import { PDFPage, PDFFont, rgb } from "pdf-lib";
import type { Layout, Rect } from "./types";
import { fitFontSize, placeX, baselineY, Metrics } from "./geometry";

/** Everything a field renderer needs to put ink on one page. */
export interface DrawContext {
  page: PDFPage;
  font: PDFFont;
  metrics: Metrics;
}

/** Wrap a pdf-lib font as the geometry module's Metrics port. */
export function metricsFor(font: PDFFont): Metrics {
  return {
    widthOf: (t, s) => font.widthOfTextAtSize(t, s),
    heightOf: (s) => font.heightAtSize(s),
  };
}

/**
 * Draw a string inside a box, honouring alignment, vertical placement and
 * overflow. Coordinates are PDF-native (bottom-left origin, y up); the text
 * baseline is derived from the rect and font metrics. Empty text draws nothing.
 */
export function drawInRect(ctx: DrawContext, text: string, rect: Rect, layout: Layout): void {
  if (text === "") return;
  const padding = layout.padding ?? 2;
  const overflow = layout.overflow ?? "shrink";
  const align = layout.align ?? "left";
  const vAlign = layout.vAlign ?? "middle";

  const size = fitFontSize(text, rect, layout.fontSize ?? 10, padding, overflow, ctx.metrics);
  const x = placeX(text, rect, size, padding, align, ctx.metrics);
  const y = baselineY(rect, size, vAlign);
  ctx.page.drawText(text, { x, y, size, font: ctx.font, color: rgb(0, 0, 0) });
}

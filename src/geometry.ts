import type { Rect } from "./types";

export interface Metrics {
  widthOf(text: string, size: number): number;
  heightOf(size: number): number;
}

const FLOOR = 4;

export function fitFontSize(
  text: string,
  rect: Rect,
  size: number,
  padding: number,
  overflow: string,
  m: Metrics,
): number {
  if (overflow !== "shrink") return size;
  const max = rect.w - 2 * padding;
  let s = size;
  while (s > FLOOR && m.widthOf(text, s) > max) s -= 0.5;
  return s;
}

export function placeX(
  text: string,
  rect: Rect,
  size: number,
  padding: number,
  align: string,
  m: Metrics,
): number {
  const w = m.widthOf(text, size);
  if (align === "right") return rect.x + rect.w - w - padding;
  if (align === "center") return rect.x + (rect.w - w) / 2;
  return rect.x + padding;
}

export function baselineY(rect: Rect, size: number, vAlign: string): number {
  const cap = size * 0.72; // approx cap height
  const descender = size * 0.2;
  if (vAlign === "top") return rect.y + rect.h - cap;
  if (vAlign === "bottom") return rect.y + descender;
  return rect.y + (rect.h - cap) / 2; // middle: center the cap box
}

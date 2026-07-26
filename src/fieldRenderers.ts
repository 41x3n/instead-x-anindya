import type {
  CheckboxField,
  Field,
  Layout,
  Rect,
  RepeatField,
  SsnField,
  TextField,
  CurrencyField,
} from "./types";
import { resolvePath } from "./resolve";
import { formatValue, FormatOptions } from "./format";
import { drawInRect, DrawContext } from "./draw";

/** Context passed to every field renderer: where to draw plus the data to pull from. */
export interface RenderContext extends DrawContext {
  data: unknown;
  defaults: Layout;
}

/** A strategy for drawing one kind of field. */
export type FieldRenderer<F extends Field = Field> = (field: F, ctx: RenderContext) => void;

/** Merge document defaults with a field's own layout overrides. */
function layoutFor(defaults: Layout, f: { layout?: Layout }): Layout {
  return { ...defaults, ...(f.layout ?? {}) };
}

/** text | date | currency | single-rect ssn: resolve → format → draw. */
const renderScalar: FieldRenderer<TextField | CurrencyField | SsnField> = (field, ctx) => {
  const raw = resolvePath(ctx.data, field.value.$ref);
  const value = raw ?? field.default;
  const format = (field as { format?: FormatOptions }).format;
  const text = formatValue(field.type, value, format);
  drawInRect(ctx, text, field.rect as Rect, layoutFor(ctx.defaults, field));
};

/** Draw a mark only when the referenced value matches the field's condition. */
const renderCheckbox: FieldRenderer<CheckboxField> = (field, ctx) => {
  const raw = resolvePath(ctx.data, field.value.$ref);
  if (raw !== field.when.equals) return;
  const mark = field.format?.mark ?? "X";
  drawInRect(ctx, mark, field.rect, { ...layoutFor(ctx.defaults, field), align: "center" });
};

/** SSN across a single box (XXX-XX-XXXX) or three segmented boxes (3-2-4 digits). */
const renderSsn: FieldRenderer<SsnField> = (field, ctx) => {
  if (!Array.isArray(field.rect)) {
    renderScalar(field, ctx);
    return;
  }
  const digits = String(resolvePath(ctx.data, field.value.$ref) ?? "").replace(/\D/g, "");
  const groups = [digits.slice(0, 3), digits.slice(3, 5), digits.slice(5, 9)];
  field.rect.forEach((r, i) =>
    drawInRect(ctx, groups[i] ?? "", r, { ...layoutFor(ctx.defaults, field), align: "center" }),
  );
};

/** Repeat a set of columns once per array element, stepping y down by rowHeight. */
const renderRepeat: FieldRenderer<RepeatField> = (field, ctx) => {
  const arr = resolvePath(ctx.data, field.from.$ref);
  if (!Array.isArray(arr)) return;
  const rows = Math.min(arr.length, field.maxRows);
  for (let i = 0; i < rows; i++) {
    for (const col of field.columns) {
      const scope = { ...(ctx.data as object), $row: arr[i] };
      const text = formatValue(
        col.type,
        resolvePath(scope, col.value.$ref),
        col.format as FormatOptions,
      );
      const rect = { ...col.rect, y: col.rect.y - field.rowHeight * i };
      drawInRect(ctx, text, rect, layoutFor(ctx.defaults, col));
    }
  }
};

/** Strategy registry: field type → renderer. Dispatch replaces a conditional chain. */
export const fieldRenderers: Record<Field["type"], FieldRenderer> = {
  text: renderScalar as FieldRenderer,
  date: renderScalar as FieldRenderer,
  currency: renderScalar as FieldRenderer,
  ssn: renderSsn as FieldRenderer,
  checkbox: renderCheckbox as FieldRenderer,
  repeat: renderRepeat as FieldRenderer,
};

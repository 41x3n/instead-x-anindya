export interface Ref {
  $ref: string;
}
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Align = "left" | "right" | "center";
export type VAlign = "top" | "middle" | "bottom";
export type Overflow = "shrink" | "clip" | "spill";
export type OnMissing = "skip";

export interface Layout {
  align?: Align;
  vAlign?: VAlign;
  padding?: number;
  font?: string;
  fontSize?: number;
  overflow?: Overflow;
}
export interface Defaults extends Layout {
  onMissing?: OnMissing;
}

export interface BaseField {
  id: string;
  page: number;
  value?: Ref;
  layout?: Layout;
  default?: string | number;
}

export interface TextField extends BaseField {
  type: "text" | "date";
  rect: Rect;
  value: Ref;
  format?: { pattern?: string };
}
export interface CurrencyField extends BaseField {
  type: "currency";
  rect: Rect;
  value: Ref;
  format?: { decimals?: number; negatives?: "parens" | "minus"; symbol?: string };
}
export interface CheckboxField extends BaseField {
  type: "checkbox";
  rect: Rect;
  value: Ref;
  when: { equals: string | number | boolean };
  format?: { mark?: string };
}
export interface SsnField extends BaseField {
  type: "ssn";
  value: Ref;
  split: "chars";
  rect: Rect[];
}
export interface RepeatColumn {
  id: string;
  rect: Rect;
  value: Ref;
  type: "text" | "currency" | "date";
  format?: Record<string, unknown>;
  layout?: Layout;
}
export interface RepeatField {
  id: string;
  type: "repeat";
  page: number;
  from: Ref;
  maxRows: number;
  rowHeight: number;
  columns: RepeatColumn[];
}

export type Field = TextField | CurrencyField | CheckboxField | SsnField | RepeatField;

export interface AnnotationDoc {
  $schema?: string;
  spec: "instead.annotation/v1";
  form: {
    id: string;
    taxYear: number;
    title: string;
    source: {
      file: string;
      sha256?: string;
      pages: { index: number; width: number; height: number }[];
    };
  };
  document: { unit: "pt"; origin: "bottom-left" };
  defaults?: Defaults;
  fields: Field[];
}

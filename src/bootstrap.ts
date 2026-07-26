import { PDFDocument, PDFName, PDFRef } from "pdf-lib";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import type { AnnotationDoc, Rect } from "./types";

export interface Widget {
  name: string;
  page: number;
  rect: Rect;
}

export async function extractWidgets(pdfBytes: Uint8Array): Promise<Widget[]> {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages();
  const pageIndex = new Map<string, number>();
  pages.forEach((p, i) => pageIndex.set(p.ref.toString(), i));

  const out: Widget[] = [];
  const form = doc.getForm();
  for (const field of form.getFields()) {
    const name = field.getName();
    for (const widget of field.acroField.getWidgets()) {
      const { x, y, width, height } = widget.getRectangle();
      const pRef = widget.dict.get(PDFName.of("P")) as PDFRef | undefined;
      const page = pRef ? (pageIndex.get(pRef.toString()) ?? 0) : 0;
      out.push({ name, page, rect: { x, y, w: width, h: height } });
    }
  }
  return out;
}

export async function bootstrapDoc(
  pdfBytes: Uint8Array,
  meta: {
    id: string;
    taxYear: number;
    title: string;
    file: string;
  },
): Promise<AnnotationDoc> {
  const doc = await PDFDocument.load(pdfBytes);
  const pages = doc.getPages().map((p, index) => {
    const { width, height } = p.getSize();
    return { index, width, height };
  });
  const sha256 = createHash("sha256").update(pdfBytes).digest("hex");
  const widgets = await extractWidgets(pdfBytes);
  return {
    $schema: "../spec/instead.annotation.schema.json",
    spec: "instead.annotation/v1",
    form: {
      id: meta.id,
      taxYear: meta.taxYear,
      title: meta.title,
      source: { file: meta.file, sha256, pages },
    },
    document: { unit: "pt", origin: "bottom-left" },
    defaults: {
      font: "Helvetica",
      fontSize: 10,
      align: "left",
      vAlign: "middle",
      overflow: "shrink",
    },
    fields: widgets.map((w) => ({
      id: w.name,
      type: "text" as const,
      page: w.page,
      rect: w.rect,
      value: { $ref: "" },
    })),
  };
}

// CLI: tsx src/bootstrap.ts <pdf> <id> <taxYear> <title>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [pdf, id, taxYear, title] = process.argv.slice(2);
  const bytes = new Uint8Array(readFileSync(pdf));
  bootstrapDoc(bytes, { id, taxYear: Number(taxYear), title, file: pdf.split("/").pop()! }).then(
    (d) => console.log(JSON.stringify(d, null, 2)),
  );
}

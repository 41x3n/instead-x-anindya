import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { renderForm, validateDoc } from "../src/render";

const ann = {
  spec: "instead.annotation/v1",
  form: {
    id: "us.irs.1040",
    taxYear: 2024,
    title: "Form 1040",
    source: {
      file: "f1040.pdf",
      pages: [
        { index: 0, width: 612, height: 792 },
        { index: 1, width: 612, height: 792 },
      ],
    },
  },
  document: { unit: "pt", origin: "bottom-left" },
  defaults: {
    font: "Helvetica",
    fontSize: 10,
    align: "left",
    vAlign: "middle",
    overflow: "shrink",
  },
  fields: [
    {
      id: "taxpayer.firstName",
      type: "text",
      page: 0,
      rect: { x: 76, y: 690, w: 180, h: 15 },
      value: { $ref: "taxpayer.firstName" },
    },
    {
      id: "filingStatus.single",
      type: "checkbox",
      page: 0,
      rect: { x: 54, y: 620, w: 10, h: 10 },
      value: { $ref: "taxpayer.filingStatus" },
      when: { equals: "single" },
      format: { mark: "X" },
    },
  ],
} as const;

const data = { taxpayer: { firstName: "Ada", filingStatus: "single" } };

test("validateDoc rejects a malformed doc", () => {
  expect(() => validateDoc({ spec: "wrong" })).toThrow();
});

test("renders a non-empty PDF over the real 1040", async () => {
  const pdfBytes = new Uint8Array(readFileSync("forms/f1040.pdf"));
  const out = await renderForm({ annotation: ann as any, data, pdfBytes });
  expect(out.byteLength).toBeGreaterThan(pdfBytes.byteLength - 100000);
  expect(new TextDecoder().decode(out.slice(0, 5))).toBe("%PDF-");
});

test("aborts when page sizes mismatch source", async () => {
  const pdfBytes = new Uint8Array(readFileSync("forms/f1040.pdf"));
  const bad = structuredClone(ann) as any;
  bad.form.source.pages[0].width = 999;
  await expect(renderForm({ annotation: bad, data, pdfBytes })).rejects.toThrow();
});

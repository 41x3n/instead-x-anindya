import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { extractWidgets } from "../src/bootstrap";

test("extracts widgets with page + rect from the real 1040", async () => {
  const bytes = readFileSync("forms/f1040.pdf");
  const widgets = await extractWidgets(new Uint8Array(bytes));
  expect(widgets.length).toBeGreaterThan(100);
  const w = widgets[0];
  expect(typeof w.name).toBe("string");
  expect(w.page).toBeGreaterThanOrEqual(0);
  expect(w.rect.w).toBeGreaterThan(0);
  expect(w.rect.h).toBeGreaterThan(0);
});

test("resolves widgets across both pages of the 1040", async () => {
  const bytes = readFileSync("forms/f1040.pdf");
  const widgets = await extractWidgets(new Uint8Array(bytes));
  const pages = new Set(widgets.map((w) => w.page));
  expect(pages.has(0)).toBe(true);
  expect(pages.has(1)).toBe(true);
});

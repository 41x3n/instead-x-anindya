import { expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { buildFieldMap } from "../tools/fieldmap";

test("field map produces a valid PDF for the 1040", async () => {
  const bytes = new Uint8Array(readFileSync("forms/f1040.pdf"));
  const out = await buildFieldMap(bytes);
  expect(new TextDecoder().decode(out.slice(0, 5))).toBe("%PDF-");
  expect(out.byteLength).toBeGreaterThan(1000);
});

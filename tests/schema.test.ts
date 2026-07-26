import { expect, test } from "vitest";
import Ajv2020 from "ajv/dist/2020";
import schema from "../spec/instead.annotation.schema.json" assert { type: "json" };

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(schema);

const validDoc = {
  spec: "instead.annotation/v1",
  form: {
    id: "us.irs.1040",
    taxYear: 2024,
    title: "Form 1040",
    source: { file: "f1040.pdf", pages: [{ index: 0, width: 612, height: 792 }] },
  },
  document: { unit: "pt", origin: "bottom-left" },
  fields: [
    {
      id: "taxpayer.firstName",
      type: "text",
      page: 0,
      rect: { x: 76.3, y: 690.2, w: 180, h: 15.6 },
      value: { $ref: "taxpayer.firstName" },
    },
  ],
};

test("accepts a valid annotation doc", () => {
  expect(validate(validDoc)).toBe(true);
});

test("rejects a bad path in $ref", () => {
  const bad = structuredClone(validDoc);
  (bad.fields[0].value as any).$ref = "taxpayer..bad[*]";
  expect(validate(bad)).toBe(false);
});

test("rejects unknown field type", () => {
  const bad = structuredClone(validDoc);
  (bad.fields[0] as any).type = "banana";
  expect(validate(bad)).toBe(false);
});

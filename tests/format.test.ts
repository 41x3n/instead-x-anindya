import { expect, test } from "vitest";
import { formatValue } from "../src/format";

test("currency: whole-dollar, thousands separators", () => {
  expect(formatValue("currency", 50000)).toBe("50,000");
  expect(formatValue("currency", 1234.56, { decimals: 2 })).toBe("1,234.56");
});

test("currency: negatives in parens", () => {
  expect(formatValue("currency", -200, { negatives: "parens" })).toBe("(200)");
});

test("date: ISO to MM/DD/YYYY", () => {
  expect(formatValue("date", "2024-04-15")).toBe("04/15/2024");
});

test("ssn: grouped", () => {
  expect(formatValue("ssn", "123456789")).toBe("123-45-6789");
});

test("null-ish yields empty string", () => {
  expect(formatValue("text", null)).toBe("");
  expect(formatValue("currency", undefined)).toBe("");
});

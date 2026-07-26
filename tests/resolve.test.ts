import { expect, test } from "vitest";
import { resolvePath, parsePath } from "../src/resolve";

const data = {
  taxpayer: { firstName: "Ada", ssn: "123456789" },
  income: { w2: [{ wages: 50000 }, { wages: 1200 }] },
};

test("parses dotted and indexed paths", () => {
  expect(parsePath("income.w2[0].wages")).toEqual(["income", "w2", 0, "wages"]);
});

test("resolves nested value", () => {
  expect(resolvePath(data, "taxpayer.firstName")).toBe("Ada");
  expect(resolvePath(data, "income.w2[1].wages")).toBe(1200);
});

test("returns undefined for missing segment", () => {
  expect(resolvePath(data, "taxpayer.middleName")).toBeUndefined();
  expect(resolvePath(data, "income.w2[9].wages")).toBeUndefined();
});

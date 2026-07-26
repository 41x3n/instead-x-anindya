import { expect, test } from "vitest";
import { fitFontSize, placeX, baselineY, Metrics } from "../src/geometry";

// fake monospace-ish metrics: each char = 0.5*size wide, height = size
const m: Metrics = { widthOf: (t, s) => t.length * 0.5 * s, heightOf: (s) => s };
const rect = { x: 100, y: 200, w: 50, h: 20 };

test("right align pushes text to the right edge minus width", () => {
  const x = placeX("ABCD", rect, 10, 2, "right", m); // width=20
  expect(x).toBeCloseTo(100 + 50 - 20 - 2);
});

test("left align sits at x + padding", () => {
  expect(placeX("ABCD", rect, 10, 2, "left", m)).toBeCloseTo(102);
});

test("shrink reduces size until it fits", () => {
  const wide = "X".repeat(18); // at size 10 => width 90 > 46; fits once small enough
  const s = fitFontSize(wide, rect, 10, 2, "shrink", m);
  expect(s).toBeLessThan(10);
  expect(m.widthOf(wide, s)).toBeLessThanOrEqual(rect.w - 4 + 1e-9);
});

test("shrink never goes below the legibility floor", () => {
  const unfittable = "X".repeat(40); // 40*0.5*4 = 80 > 46 even at the floor
  const s = fitFontSize(unfittable, rect, 10, 2, "shrink", m);
  expect(s).toBe(4); // stops at floor; overflow tolerated rather than illegible text
});

test("baseline for middle sits inside the box", () => {
  const y = baselineY(rect, 10, "middle");
  expect(y).toBeGreaterThan(rect.y);
  expect(y).toBeLessThan(rect.y + rect.h);
});

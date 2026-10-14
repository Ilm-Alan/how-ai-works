import { expect, test } from "bun:test";
import { series } from "./data";
import { bandHalfWidth, doublingDays, fitExp, yearOf } from "./trend";

test("recovers an exact exponential: doubling every 0.5 years", () => {
  const t = [2020, 2020.5, 2021, 2021.5, 2022];
  const f = fitExp(t, t.map((x) => 3 * 2 ** ((x - 2020) / 0.5)));
  expect(doublingDays(f)).toBeCloseTo(182.6, 1);
  expect(f.sd).toBeCloseTo(0, 10);
});

test("prediction band is narrowest at the data's center", () => {
  const t = [2020, 2021, 2022, 2023];
  const f = fitExp(t, [1, 3, 8, 30]);
  expect(bandHalfWidth(f, 2021.5)).toBeLessThan(bandHalfWidth(f, 2026));
});

test("yearOf maps dates to fractional years", () => {
  expect(yearOf("2024-01-01")).toBe(2024);
  expect(yearOf("2025-07-02")).toBeCloseTo(2025.5, 2);
});

test("METR series fit from 2023 on (excluding >16h) is close to METR's published 129-day doubling", () => {
  const s = series.find((x) => x.id === "metr")!;
  const pts = s.points.filter(([d, , v]) => d >= "2023-01-01" && v <= s.reliableMax!);
  const f = fitExp(pts.map(([d]) => yearOf(d)), pts.map(([, , v]) => v));
  // METR reports 128.7 days (CI 104–158) with its own method; an OLS fit on SOTA points should land in that range.
  expect(doublingDays(f)).toBeGreaterThan(104);
  expect(doublingDays(f)).toBeLessThan(158);
});

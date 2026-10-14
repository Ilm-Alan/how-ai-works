import { expect, test } from "bun:test";
import { decodeBound, expectedTokens, simulate, speculativeSpeedup } from "./inference";

test("capped geometric exact cases and endpoint limits", () => {
  expect(expectedTokens(0.5, 3)).toBeCloseTo(1.875, 12);
  expect(expectedTokens(0.8, 4)).toBeCloseTo(3.3616, 12);
  expect(expectedTokens(0, 16)).toBe(1);
  expect(expectedTokens(1, 16)).toBe(17);
  expect(expectedTokens(0.7, 0)).toBe(1);
  expect(expectedTokens(1 - 1e-12, 16)).toBeCloseTo(17, 8);
});

test("Monte Carlo matches formula across acceptance rates and draft lengths", () => {
  for (const alpha of [0, 0.2, 0.5, 0.8, 0.98, 1]) {
    for (const k of [0, 1, 4, 16]) {
      const s = simulate(alpha, k, 100000, 1701 + k);
      expect(Math.abs(s.mean - expectedTokens(alpha, k))).toBeLessThan(6 * s.standardError + 1e-10);
      expect(s.histogram.reduce((a, b) => a + b, 0)).toBe(100000);
      expect(s.histogram[0]).toBe(0);
    }
  }
});

test("simulation reproduces the same run with the same seed", () => {
  expect(simulate(0.7, 5, 1000, 3)).toEqual(simulate(0.7, 5, 1000, 3));
});

test("drafting can lose even though verification emits at least one token", () => {
  expect(speculativeSpeedup(0, 4, 0.1)).toBeLessThan(1);
  expect(speculativeSpeedup(0.8, 4, 0.1)).toBeCloseTo(2.401142857, 8);
  expect(speculativeSpeedup(0.8, 4, 0.1, 2)).toBeLessThan(speculativeSpeedup(0.8, 4, 0.1));
});

test("batching amortizes weights; per-request KV reads limit the gain", () => {
  expect(decodeBound(2e12, 16e9, 1).perSequence).toBe(125);
  expect(decodeBound(2e12, 16e9, 8).aggregate).toBe(1000);
  expect(decodeBound(2e12, 16e9, 8, 1e9).aggregate).toBeCloseTo(666.6667, 3);
});

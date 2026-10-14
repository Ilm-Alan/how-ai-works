import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { exact, simulate } from "./reliability";

test("without verification, success is p^n and every failure is silent", () => {
  const o = exact({ p: 0.95, steps: 20, detect: 0, retries: 3 });
  expect(o.success).toBeCloseTo(0.95 ** 20, 12);
  expect(o.silent).toBeCloseTo(1 - 0.95 ** 20, 12);
  expect(o.stopped).toBe(0);
});

test("outcomes sum to one", () => {
  const o = exact({ p: 0.8, steps: 15, detect: 0.7, retries: 2 });
  expect(o.success + o.silent + o.stopped).toBeCloseTo(1, 12);
});

test("perfect detection with unlimited-ish retries approaches certain success", () => {
  expect(exact({ p: 0.5, steps: 10, detect: 1, retries: 30 }).success).toBeGreaterThan(0.9999);
});

test("Monte Carlo agrees with the closed form", () => {
  const params = { p: 0.9, steps: 12, detect: 0.6, retries: 1 };
  const e = exact(params);
  const m = simulate(params, 200_000, rng(5));
  expect(m.success).toBeCloseTo(e.success, 2);
  expect(m.silent).toBeCloseTo(e.silent, 2);
  expect(m.stopped).toBeCloseTo(e.stopped, 2);
});

import { expect, test } from "bun:test";
import { attention } from "./attention";

test("matches softmax(QK transpose / sqrt(d) + M)V including additive biases", () => {
  const q = [1, 2, -1, 0.5];
  const k = [2, -1, 0.5, 3];
  const v = [2, -3, 6, 5];
  const mask = [0.7, -0.2, -Infinity, 0];
  const a = attention(q, k, v, 2, 2, 2, { mask });
  const s0 = (1 * 2 + 2 * -1) / Math.sqrt(2) + 0.7;
  const s1 = (1 * 0.5 + 2 * 3) / Math.sqrt(2) - 0.2;
  const p = Math.exp(s0) / (Math.exp(s0) + Math.exp(s1));
  expect(a.scores[0]).toBeCloseTo(s0, 12);
  expect(a.scores[1]).toBeCloseTo(s1, 12);
  expect(a.weights[0]).toBeCloseTo(p, 12);
  expect(a.weights[1]).toBeCloseTo(1 - p, 12);
  expect(a.output[0]).toBeCloseTo(2 * p + 6 * (1 - p), 12);
  expect(a.output[1]).toBeCloseTo(-3 * p + 5 * (1 - p), 12);
  expect(a.weights[2]).toBe(0);
  expect(Array.from(a.output.slice(2))).toEqual([6, 5]);
});

test("causal mask is applied before normalization; future values cannot leak", () => {
  const a = attention([0, 0, 0], [0, 0, 0], [4, 8, 12], 3, 1, 1, { causal: true });
  expect(Array.from(a.weights)).toEqual([1, 0, 0, 0.5, 0.5, 0, 1 / 3, 1 / 3, 1 / 3]);
  expect(Array.from(a.output)).toEqual([4, 6, 8]);
});

test("stable softmax, uniform rows, temperature and scaling", () => {
  const uniform = attention([0, 0], [2000, -2000], [2, 6], 2, 1, 1);
  expect(Array.from(uniform.output)).toEqual([4, 4]);
  const q = [1, 1, 1, 1];
  const k = [1000, 1000, 999, 999];
  const normal = attention(q, k, [0, 1], 2, 2, 1);
  const cold = attention(q, k, [0, 1], 2, 2, 1, { scale: false });
  const warm = attention(q, k, [0, 1], 2, 2, 1, { temperature: 2 });
  expect(cold.weights[0]!).toBeGreaterThan(normal.weights[0]!);
  expect(warm.weights[0]!).toBeLessThan(normal.weights[0]!);
  for (const a of [normal, cold, warm]) expect(a.weights[0]! + a.weights[1]!).toBeCloseTo(1, 12);
});

test("rejects undefined all-masked rows and invalid shapes", () => {
  expect(() => attention([1], [1], [1], 1, 1, 1, { mask: [-Infinity] })).toThrow();
  expect(() => attention([1], [1], [1], 1, 1, 1, { temperature: 0 })).toThrow();
  expect(() => attention([1], [1], [1], 2, 1, 1)).toThrow();
});

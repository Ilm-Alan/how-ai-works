import { expect, test } from "bun:test";
import { entropyBits, softmax } from "./softmax";

test("softmax sums to one and is shift-invariant", () => {
  const p = softmax([1, 2, 3]);
  expect(p.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  softmax([101, 102, 103]).forEach((v, i) => expect(v).toBeCloseTo(p[i]!, 12));
});

test("large logits do not overflow", () => {
  const p = softmax([1000, 999]);
  expect(p[0]).toBeCloseTo(1 / (1 + Math.exp(-1)), 12);
});

test("temperature limits: low → one-hot, high → uniform", () => {
  const cold = softmax([1, 3, 2], 0.01);
  expect(cold[1]).toBeCloseTo(1, 6);
  const hot = softmax([1, 3, 2], 1e6);
  hot.forEach((v) => expect(v).toBeCloseTo(1 / 3, 4));
});

test("entropy: uniform over 8 is 3 bits, one-hot is 0", () => {
  expect(entropyBits(Array(8).fill(1 / 8))).toBeCloseTo(3, 12);
  expect(entropyBits([0, 1, 0])).toBe(0);
});

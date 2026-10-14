import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { distribution, filter, generate, loss, train } from "./ngram";
const options = { temperature: 1, topK: 0, topP: 1, minP: 0 };
test("counts, smoothing, and longest suffix backoff", () => {
  const m = train("abab", 3), out = distribution(m, "a");
  expect(out.matched).toBe(1); expect(out.probabilities[m.alphabet.indexOf("b")]).toBeCloseTo(2.1 / 2.2);
  expect(distribution(m, "xxa").matched).toBe(1);
  expect(distribution(m, "xx").matched).toBe(0);
  expect(out.probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1);
});
test("nucleus keeps crossing candidate; top-k and min-p differ", () => {
  expect(filter([0.6, 0.25, 0.15], { ...options, topP: 0.8 })).toEqual([0.6 / 0.85, 0.25 / 0.85, 0]);
  expect(filter([0.6, 0.25, 0.15], { ...options, topK: 1 })).toEqual([1, 0, 0]);
  expect(filter([0.4, 0.35, 0.2, 0.05], { ...options, minP: 0.2 })[3]).toBe(0);
});
test("temperature sharpening, greedy and normalization", () => {
  expect(filter([0.8, 0.2], { ...options, temperature: 0.5 })[0]).toBeGreaterThan(0.8);
  expect(filter([0.2, 0.8], { ...options, temperature: 0 })).toEqual([0, 1]);
  expect(filter([0.1, 0.2, 0.7], { ...options, topP: 0, minP: 1 })).toEqual([0, 0, 1]);
  expect(filter([], options)).toEqual([]);
});
test("loss and seeded generation", () => {
  const m = train("abab", 1); expect(loss(m, "ab").nats).toBeCloseTo(Math.log(2)); expect(loss(m, "ab").perplexity).toBeCloseTo(2);
  expect(loss(m, "z").nats).toBe(Infinity); expect(loss(m, "z").unknown).toBe(1);
  expect(generate(m, "", 20, options, rng(7))).toBe(generate(m, "", 20, options, rng(7)));
  expect(generate(train("", 1), "hello", 20, options, rng(7))).toBe("hello");
  expect(() => train("a", 7)).toThrow();
});

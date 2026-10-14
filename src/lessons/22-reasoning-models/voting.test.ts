import { expect, test } from "bun:test";
import { majorityAccuracy, bestOfAccuracy } from "./voting";
test("binary three-vote majority and boundary cases", () => {
  expect(majorityAccuracy(0.7, 1, 3)).toBeCloseTo(3 * 0.7 ** 2 - 2 * 0.7 ** 3, 12);
  expect(majorityAccuracy(0.3, 4, 1)).toBeCloseTo(0.3, 12);
  expect(majorityAccuracy(0, 3, 9)).toBe(0);
  expect(majorityAccuracy(1, 3, 9)).toBe(1);
  expect(majorityAccuracy(1 / 3, 2, 9)).toBeCloseTo(1 / 3, 12);
});
test("multinomial result agrees with exhaustive ordered draws", () => {
  const probs = [0.4, 0.3, 0.3]; let total = 0;
  function visit(counts: number[], depth: number, probability: number) {
    if (depth === 5) { const max = Math.max(...counts); if (counts[0] === max) total += probability / counts.filter(x => x === max).length; return; }
    for (let i = 0; i < 3; i++) { counts[i]!++; visit(counts, depth + 1, probability * probs[i]!); counts[i]!--; }
  }
  visit([0, 0, 0], 0, 1);
  expect(majorityAccuracy(0.4, 2, 5)).toBeCloseTo(total, 12);
});
test("plurality helps above threshold and hurts below", () => {
  expect(majorityAccuracy(0.4, 2, 31)).toBeGreaterThan(0.4);
  expect(majorityAccuracy(0.2, 2, 31)).toBeLessThan(0.2);
});
test("perfect, random and inverted verifier limits", () => {
  expect(bestOfAccuracy(0.3, 1, 7)).toBeCloseTo(1 - 0.7 ** 7, 12);
  expect(bestOfAccuracy(0.3, 0.5, 7)).toBeCloseTo(0.3, 12);
  expect(bestOfAccuracy(0.3, 0, 7)).toBeCloseTo(0.3 ** 7, 12);
  expect(bestOfAccuracy(0.3, 0.8, 1)).toBeCloseTo(0.3, 12);
});

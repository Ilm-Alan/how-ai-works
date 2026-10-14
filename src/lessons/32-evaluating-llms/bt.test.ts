import { expect, test } from "bun:test";
import { fitBT, simulateVotes, strengths, winProbability, bootstrapBT } from "./bt";

test("many votes recover centered known strengths", () => {
  const fit = fitBT(6, simulateVotes(60000, 19));
  fit.forEach((v, i) => expect(Math.abs(v - strengths[i]!)).toBeLessThan(0.06));
});
test("ratings and probabilities are invariant to a common shift", () => {
  const shifted = strengths.map(v => v + 20);
  const original = simulateVotes(3000, 8);
  expect(simulateVotes(3000, 8, 0, shifted)).toEqual(original);
  expect(fitBT(6, original)).toEqual(fitBT(6, simulateVotes(3000, 8, 0, shifted)));
  expect(winProbability(2, 1)).toBeCloseTo(winProbability(102, 101), 12);
});
test("equal pair has equal ratings and empty data stay finite", () => {
  expect(fitBT(2, [{ a: 0, b: 1, winner: 0 }, { a: 0, b: 1, winner: 1 }])).toEqual([0, 0]);
  expect(fitBT(3, [])).toEqual([0, 0, 0]);
});
test("bootstrap is deterministic and ordered", () => {
  const votes = simulateVotes(200, 2);
  const intervals = bootstrapBT(6, votes, 7, 40);
  expect(intervals).toEqual(bootstrapBT(6, votes, 7, 40));
  intervals.forEach(([lo, hi]) => expect(lo).toBeLessThanOrEqual(hi));
});

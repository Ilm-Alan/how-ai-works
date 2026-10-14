import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { candidateProbability, candidates, estimate, jaccard, shingles, signatures } from "./minhash";

test("shingles normalize words and discard repetition", () => {
  expect([...shingles("One, TWO one two", 2)]).toEqual(["one two", "two one"]);
  expect(shingles("short", 2).size).toBe(0);
  expect(() => shingles("a", 0)).toThrow();
  expect(jaccard(new Set(), new Set())).toBe(1);
  expect(jaccard(new Set(["a"]), new Set(["b"]))).toBe(0);
});
test("MinHash converges statistically to true Jaccard", () => {
  const a = new Set(["a", "b", "c", "d"]), b = new Set(["c", "d", "e", "f"]);
  const sig = signatures([a, b, a], 8192);
  expect(Math.abs(estimate(sig[0]!, sig[1]!) - jaccard(a, b))).toBeLessThan(0.025);
  expect(estimate(sig[0]!, sig[2]!)).toBe(1);
  let smallError = 0, largeError = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const s = signatures([a, b], 256, seed);
    smallError += (estimate(s[0]!.slice(0, 8), s[1]!.slice(0, 8)) - 1 / 3) ** 2;
    largeError += (estimate(s[0]!, s[1]!) - 1 / 3) ** 2;
  }
  expect(largeError).toBeLessThan(smallError / 8);
});
test("band collisions follow 1-(1-s^r)^b", () => {
  expect(candidateProbability(0, 8, 4)).toBe(0);
  expect(candidateProbability(1, 8, 4)).toBe(1);
  expect(candidateProbability(0.5, 2, 2)).toBe(0.4375);
  const r = rng(12); let hits = 0;
  for (let trial = 0; trial < 5000; trial++) {
    const a = Array.from({ length: 8 }, (_, i) => i);
    const b = a.map(v => r.next() < 0.6 ? v : v + 100);
    hits += Number(candidates([a, b], 4, 2).length > 0);
  }
  expect(Math.abs(hits / 5000 - candidateProbability(0.6, 4, 2))).toBeLessThan(0.025);
  expect(candidates([[1, 2, 3, 4], [1, 2, 9, 9], [1, 2, 3, 4]], 2, 2)).toEqual([[0, 1], [0, 2], [1, 2]]);
  expect(candidates([[Infinity], [Infinity]], 1, 1)).toEqual([]);
  expect(() => candidates([[1]], 2, 2)).toThrow();
});

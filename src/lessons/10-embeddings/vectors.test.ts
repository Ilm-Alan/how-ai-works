import { expect, test } from "bun:test";
import { cooccurrence, cosine, neighbors, ppmi, svd } from "./vectors";
test("PPMI removes independence and handles empty rows", () => {
  expect([...ppmi(Float64Array.of(1, 1, 1, 1), 2)]).toEqual([0, 0, 0, 0]);
  const diagonal = ppmi(Float64Array.of(2, 0, 0, 2), 2);
  expect(diagonal[0]).toBeCloseTo(Math.log(2)); expect(diagonal[3]).toBeCloseTo(Math.log(2));
  expect([...ppmi(new Float64Array(4), 2)]).toEqual([0, 0, 0, 0]);
});
test("counts are symmetric and do not cross sentences", () => {
  const m = cooccurrence("cats sleep. dogs run.", 4);
  const a = m.words.indexOf("cats"), b = m.words.indexOf("sleep"), c = m.words.indexOf("dogs");
  expect(m.matrix[a * m.size + b]).toBe(1); expect(m.matrix[b * m.size + a]).toBe(1);
  expect(m.matrix[a * m.size + c]).toBe(0);
});
test("power SVD recovers known singular values", () => {
  const result = svd(Float64Array.of(3, 0, 0, 2), 2, 2);
  expect(result.singular[0]).toBeCloseTo(3, 5); expect(result.singular[1]).toBeCloseTo(2, 5);
  const v = result.vectors;
  expect(v[0]![0]! ** 2 + v[0]![1]! ** 2).toBeCloseTo(9, 5);
  expect(v[1]![0]! ** 2 + v[1]![1]! ** 2).toBeCloseTo(4, 5);
  expect(svd(new Float64Array(4), 2, 2).singular).toEqual([]);
});
test("cosine and nearest neighbor exclusion", () => {
  expect(cosine([2, 0], [5, 0])).toBe(1); expect(cosine([0, 0], [1, 2])).toBe(0);
  expect(cosine([1, 0], [-1, 0])).toBe(-1);
  expect(neighbors([1, 0], ["self", "near", "far"], [Float64Array.of(1, 0), Float64Array.of(2, 0), Float64Array.of(0, 1)], 2, ["self"])[0]!.word).toBe("near");
});

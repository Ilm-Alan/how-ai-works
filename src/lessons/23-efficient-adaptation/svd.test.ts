import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { reconstruct, svd } from "./svd";

const r = rng(2);
const m = 30;
const n = 20;
const A = Float64Array.from({ length: m * n }, () => r.normal());

const frob = (x: ArrayLike<number>) => Math.sqrt(Array.from(x).reduce((s, v) => s + v * v, 0));

test("full-rank reconstruction recovers the matrix", () => {
  const back = reconstruct(svd(A, m, n), n);
  for (let i = 0; i < A.length; i++) expect(back[i]).toBeCloseTo(A[i]!, 9);
});

test("singular values are descending and U, V have orthonormal columns", () => {
  const d = svd(A, m, n);
  for (let c = 1; c < n; c++) expect(d.S[c]!).toBeLessThanOrEqual(d.S[c - 1]!);
  for (let a = 0; a < n; a++)
    for (let b = 0; b < n; b++) {
      let uu = 0;
      let vv = 0;
      for (let i = 0; i < m; i++) uu += d.U[i * n + a]! * d.U[i * n + b]!;
      for (let j = 0; j < n; j++) vv += d.V[j * n + a]! * d.V[j * n + b]!;
      expect(uu).toBeCloseTo(a === b ? 1 : 0, 9);
      expect(vv).toBeCloseTo(a === b ? 1 : 0, 9);
    }
});

test("rank-r error equals the root-sum-square of the discarded singular values (Eckart–Young)", () => {
  const d = svd(A, m, n);
  for (const rank of [1, 5, 12]) {
    const approx = reconstruct(d, rank);
    const diff = A.map((v, i) => v - approx[i]!);
    let tail = 0;
    for (let c = rank; c < n; c++) tail += d.S[c]! ** 2;
    expect(frob(diff)).toBeCloseTo(Math.sqrt(tail), 8);
  }
});

test("a planted rank-3 matrix has exactly three nonzero singular values", () => {
  const B = new Float64Array(m * n);
  for (let k = 0; k < 3; k++) {
    const u = Array.from({ length: m }, () => r.normal());
    const v = Array.from({ length: n }, () => r.normal());
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) B[i * n + j]! += u[i]! * v[j]!;
  }
  const d = svd(B, m, n);
  expect(d.S[2]!).toBeGreaterThan(1);
  expect(d.S[3]!).toBeLessThan(1e-9);
});

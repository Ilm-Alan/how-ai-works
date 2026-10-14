import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { E2M1, E4M3, errorStats, quantize, roundTo } from "./quant";

test("E2M1 has exactly the OCP MX values", () => {
  expect(E2M1).toEqual([0, 0.5, 1, 1.5, 2, 3, 4, 6]);
});

test("E4M3: max 448, smallest subnormal 2^-9, 127 non-negative values", () => {
  expect(E4M3[E4M3.length - 1]).toBe(448);
  expect(E4M3[1]).toBe(2 ** -9);
  expect(E4M3.length).toBe(127);
});

test("round to nearest, ties to even, saturating", () => {
  expect(roundTo(E2M1, 0.75)).toBe(1); // tie between 0.5 (odd) and 1 (even)
  expect(roundTo(E2M1, 2.5)).toBe(2); // tie between 2 (even) and 3 (odd)
  expect(roundTo(E2M1, -5.1)).toBe(-6);
  expect(roundTo(E2M1, 100)).toBe(6);
  expect(roundTo(E4M3, 1000)).toBe(448);
});

const r = rng(1);
const w = Float32Array.from({ length: 64 * 128 }, () => 0.02 * r.normal());

test("symmetric int8 error never exceeds half a step", () => {
  const { deq } = quantize(w, 128, "int8", "tensor");
  let amax = 0;
  for (const x of w) amax = Math.max(amax, Math.abs(x));
  expect(errorStats(w, deq).maxErr).toBeLessThanOrEqual(amax / 127 / 2 + 1e-9);
});

test("MXFP4 block scales are powers of two and nothing exceeds 6x the scale", () => {
  const { deq, bitsPerWeight } = quantize(w, 128, "mxfp4", "tensor");
  expect(bitsPerWeight).toBe(4.25);
  for (let b = 0; b < w.length; b += 32) {
    let amax = 0;
    for (let i = b; i < b + 32; i++) amax = Math.max(amax, Math.abs(w[i]!));
    const scale = 2 ** (Math.floor(Math.log2(amax)) - 2);
    for (let i = b; i < b + 32; i++) {
      // Power-of-two scales make the division exact, so each code must be an E2M1 value.
      expect(E2M1).toContain(Math.abs(deq[i]! / scale));
    }
  }
});

test("smaller blocks give lower error; NVFP4 beats MXFP4 on Gaussian weights", () => {
  const err = (f: Parameters<typeof quantize>[2], g: Parameters<typeof quantize>[3]) => errorStats(w, quantize(w, 128, f, g).deq).relRmse;
  expect(err("int4", 16)).toBeLessThan(err("int4", 128));
  expect(err("int4", 128)).toBeLessThan(err("int4", "tensor"));
  expect(err("nvfp4", "tensor")).toBeLessThan(err("mxfp4", "tensor"));
  expect(quantize(w, 128, "nvfp4", "tensor").bitsPerWeight).toBe(4.5);
});

test("one large outlier under a per-tensor int4 scale rounds most weights to zero", () => {
  const v = Float32Array.from(w);
  v[17] = 1;
  expect(errorStats(v, quantize(v, 128, "int4", "tensor").deq).zeroed).toBeGreaterThan(0.9);
  expect(errorStats(v, quantize(v, 128, "int4", 32).deq).zeroed).toBeLessThan(0.3);
});

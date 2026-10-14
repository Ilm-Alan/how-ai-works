import { expect, test } from "bun:test";
import { dot, LLAMA3_8B, parameterCount, rope } from "./transformer";

test("rotates pairs by position times base^(-2i/d)", () => {
  const x = [1, 0, 1, 0];
  const y = rope(x, Math.PI / 2, 10000);
  expect(y[0]).toBeCloseTo(0, 12);
  expect(y[1]).toBeCloseTo(1, 12);
  expect(y[2]).toBeCloseTo(Math.cos(Math.PI / 200), 12);
  expect(y[3]).toBeCloseTo(Math.sin(Math.PI / 200), 12);
  expect(Array.from(rope(x, 0))).toEqual(x);
});

test("q(m) dot k(n) depends only on m-n, for fixed content vectors", () => {
  const q = [0.2, -1.1, 0.7, 2, -0.3, 0.1, 1.4, -0.6];
  const k = [-0.9, 0.4, 1.1, -0.5, 0.8, 1.5, -0.1, 0.3];
  for (const base of [10, 10000, 500000]) {
    for (const [m, n] of [[0, 0], [7, 2], [2, 7], [512, 301], [-8, 4]]) {
      const score = dot(rope(q, m!, base), rope(k, n!, base));
      expect(score).toBeCloseTo(dot(rope(q, m! - n!, base), k), 10);
      for (const shift of [-100, 11, 1000]) expect(dot(rope(q, m! + shift, base), rope(k, n! + shift, base))).toBeCloseTo(score, 10);
    }
  }
});

test("rotary transform preserves norm and inverse rotation restores vector", () => {
  const x = [2, -1, 0.3, 0.8];
  const rotated = rope(x, 234);
  expect(dot(rotated, rotated)).toBeCloseTo(dot(x, x), 12);
  const restored = rope(rotated, -234);
  x.forEach((v, i) => expect(restored[i]).toBeCloseTo(v, 12));
  expect(() => rope([1], 0)).toThrow();
});

test("published Llama 3 8B config totals 8.030261248 billion parameters", () => {
  // Meta paper table 3 + official bias-free model.py + HF config mirror.
  const p = parameterCount(LLAMA3_8B);
  expect(p.total).toBe(8_030_261_248);
  expect(p.headDim).toBe(128);
  expect(p.kvWidth).toBe(1024);
  expect(p.embeddings).toBe(1_050_673_152);
});

test("GQA shrinks only K/V; SwiGLU has three matrices; tying saves one table", () => {
  const c = { width: 8, layers: 2, heads: 4, kvHeads: 4, vocab: 20, mlpWidth: 16, mlp: "classic" as const, tied: false };
  const p = parameterCount(c);
  expect(p.attentionPerLayer).toBe(4 * 8 * 8);
  expect(p.mlpPerLayer).toBe(2 * 8 * 16);
  expect(parameterCount({ ...c, kvHeads: 1 }).attentionPerLayer).toBe(2 * 8 * 8 + 2 * 8 * 2);
  expect(parameterCount({ ...c, mlp: "swiglu" }).mlpPerLayer).toBe(3 * 8 * 16);
  expect(p.total - parameterCount({ ...c, tied: true }).total).toBe(20 * 8);
  expect(p.norms).toBe(40);
  expect(() => parameterCount({ ...c, kvHeads: 3 })).toThrow();
  expect(() => parameterCount({ ...c, heads: 3 })).toThrow();
});

import { describe, expect, test } from "bun:test";
import { patches, providerTokens, clipLoss, similarityBatch } from "./multimodal";

describe("patch accounting", () => {
  test("exact grid, edges, and attention scaling", () => {
    expect(patches(512, 384, 32).tokens).toBe(192);
    expect(patches(512, 384, 16).tokens ** 2).toBe(16 * 192 ** 2);
    expect(patches(33, 17, 16)).toEqual({ cols: 3, rows: 2, tokens: 6, paddedWidth: 48, paddedHeight: 32 });
    expect(patches(1, 1, 32).tokens).toBe(1);
    expect(() => patches(0, 16, 16)).toThrow();
  });
  test("documented provider rule is separate from patches", () => {
    expect(providerTokens(1024, 1024)).toEqual({ width: 768, height: 768, tiles: 4, tokens: 765 });
    expect(providerTokens(2048, 4096)).toEqual({ width: 768, height: 1536, tiles: 6, tokens: 1105 });
    expect(providerTokens(512, 384).tokens).toBe(255);
    expect(providerTokens(513, 384).tokens).toBe(425);
    expect(providerTokens(1, 1).tokens).toBe(255);
  });
});

describe("symmetric InfoNCE", () => {
  test("hand-computed asymmetric 2×2 case includes both directions and temperature", () => {
    // Scores / τ = [[2, 0], [1, 2]]. Row losses: log(1+e^-2), log(1+e^-1).
    // Column losses: log(1+e^-1), log(1+e^-2). Their symmetric mean is below.
    const expected = (Math.log1p(Math.exp(-2)) + Math.log1p(Math.exp(-1))) / 2;
    const result = clipLoss([[1, 0], [0.5, 1]], 0.5);
    expect(result.loss).toBeCloseTo(expected, 12);
    expect(result.rowProb[0]![0]).toBeCloseTo(1 / (1 + Math.exp(-2)), 12);
    expect(result.colProb[0]![0]).toBeCloseTo(1 / (1 + Math.exp(-1)), 12);
  });
  test("uniform scores give log batch size; transpose preserves total loss", () => {
    expect(clipLoss([[0, 0], [0, 0]], 0.1).loss).toBeCloseTo(Math.log(2), 12);
    const a = [[1, 0.4], [-0.3, 0.6]];
    const b = [[1, -0.3], [0.4, 0.6]];
    expect(clipLoss(a, 0.3).loss).toBeCloseTo(clipLoss(b, 0.3).loss, 12);
    for (const row of clipLoss(a, 0.3).rowProb) expect(row.reduce((x, y) => x + y, 0)).toBeCloseTo(1, 12);
  });
  test("stable at low temperatures and strict about shapes", () => {
    expect(clipLoss([[1, -1], [-1, 1]], 0.0001).loss).toBe(0);
    expect(clipLoss([[1]], 1).loss).toBe(0);
    expect(() => clipLoss([[1, 0]], 1)).toThrow();
    expect(() => clipLoss([[1]], 0)).toThrow();
  });
  test("seeded embeddings reproduce and mislabeled swaps are penalized", () => {
    const correct = similarityBatch(30, 0.1, false);
    expect(similarityBatch(30, 0.1, false)).toEqual(correct);
    const wrong = similarityBatch(30, 0.1, true);
    expect(clipLoss(wrong, 0.02).loss).toBeGreaterThan(clipLoss(wrong, 0.2).loss);
    expect(clipLoss(correct, 0.02).loss).toBeLessThan(clipLoss(correct, 0.2).loss);
  });
});

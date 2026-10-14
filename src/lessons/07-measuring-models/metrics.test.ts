import { expect, test } from "bun:test";
import { ci95, confusion, roc, summarize } from "./metrics";

const scores = [0.9, 0.8, 0.7, 0.6, 0.55, 0.4, 0.3, 0.1];
const labels = [1, 1, 0, 1, 0, 0, 1, 0];

test("confusion matrix and derived metrics at a threshold", () => {
  const c = confusion(scores, labels, 0.6);
  expect(c).toEqual({ tp: 3, fp: 1, tn: 3, fn: 1 });
  const s = summarize(c);
  expect(s.accuracy).toBe(0.75);
  expect(s.precision).toBe(0.75);
  expect(s.recall).toBe(0.75);
  expect(s.fpr).toBe(0.25);
});

test("AUC equals the fraction of positive-negative pairs ranked correctly", () => {
  let good = 0;
  let pairs = 0;
  for (let i = 0; i < scores.length; i++)
    for (let j = 0; j < scores.length; j++)
      if (labels[i] && !labels[j]) {
        pairs++;
        good += scores[i]! > scores[j]! ? 1 : 0;
      }
  expect(roc(scores, labels).auc).toBeCloseTo(good / pairs, 12);
});

test("ties count as half a correct ranking", () => {
  expect(roc([0.5, 0.5], [1, 0]).auc).toBeCloseTo(0.5, 12);
});

test("CI half-width shrinks with the square root of n", () => {
  expect(ci95(0.7, 100)).toBeCloseTo(0.0898, 3);
  expect(ci95(0.7, 400) / ci95(0.7, 100)).toBeCloseTo(0.5, 12);
});

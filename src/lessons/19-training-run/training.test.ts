import { expect, test } from "bun:test";
import { DEFAULT_LR, learningRate, Run } from "./training";

test("warmup and schedule boundaries", () => {
  expect(learningRate("constant", 0, 1)).toBe(0.05);
  expect(learningRate("constant", 19, 1)).toBe(1);
  expect(learningRate("cosine", 20, 1)).toBe(1);
  expect(learningRate("cosine", 399, 1)).toBe(0);
  expect(learningRate("wsd", 320, 1)).toBe(1);
  expect(learningRate("wsd", 399, 1)).toBe(0);
  expect(learningRate("wsd", 200, 1, 200, 80)).toBe(1);
  expect(learningRate("wsd", 279, 1, 200, 80)).toBe(0);
});
test("default schedules learn; decay reduces late grid error", () => {
  const stable = new Run("constant"), decay = new Run("wsd"), cosine = new Run("cosine");
  for (let i = 0; i < 400; i++) { stable.tick(); decay.tick(); cosine.tick(); }
  expect(decay.history.at(-1)!.loss).toBeLessThan(0.01);
  expect(cosine.history.at(-1)!.loss).toBeLessThan(0.01);
  expect(decay.history.at(-1)!.loss).toBeLessThan(stable.history.at(-1)!.loss);
  const early = decay.history.slice(280, 320).reduce((s, p) => s + p.loss, 0) / 40;
  const late = decay.history.slice(360, 400).reduce((s, p) => s + p.loss, 0) / 40;
  expect(late).toBeLessThan(early);
});
test("reset reproduces and branching preserves checkpoint and batches", () => {
  const a = new Run("constant"), b = new Run("constant");
  for (let i = 0; i < 100; i++) { a.tick(); b.tick(); }
  expect(a.history).toEqual(b.history);
  const branch = a.branch();
  expect(branch.weights.data).toEqual(a.weights.data);
  a.tick(); branch.tick();
  expect(branch.weights.data).toEqual(a.weights.data);
  expect(branch.peak).toBe(DEFAULT_LR);
  const before = [...a.weights.data]; branch.tick();
  expect([...a.weights.data]).toEqual(before);
});
test("excessive learning rate is reported as divergence", () => {
  const run = new Run("constant", 3);
  for (let i = 0; i < 400; i++) run.tick();
  expect(run.diverged).toBe(true);
  expect(run.step).toBeLessThan(400);
});

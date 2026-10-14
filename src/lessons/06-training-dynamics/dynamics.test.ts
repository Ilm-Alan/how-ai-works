import { expect, test } from "bun:test";
import { DeepExperiment, DEPTH, defaults } from "./dynamics";

test("reset reproduces loss and all 20 activation gradients", () => {
  const first = new DeepExperiment(defaults).measure();
  expect(first).toEqual(new DeepExperiment(defaults).measure());
  expect(first.norms).toHaveLength(DEPTH);
  expect(first.norms.every(v => Number.isFinite(v) && v > 0)).toBe(true);
});

test("default residual network carries gradients and learns the fixed task", () => {
  const model = new DeepExperiment(defaults);
  const initial = model.measure();
  expect(initial.norms[0]! / initial.norms[19]!).toBeGreaterThan(0.5);
  expect(initial.norms[0]! / initial.norms[19]!).toBeLessThan(2);
  for (let i = 0; i < 300; i++) model.measure(true);
  expect(model.measure().loss).toBeLessThan(0.01);
});

test("plain small-scale stack attenuates gradients and stalls", () => {
  const model = new DeepExperiment({ ...defaults, residual: false, norm: false });
  const initial = model.measure();
  expect(initial.norms[0]! / initial.norms[19]!).toBeLessThan(1e-3);
  for (let i = 0; i < 300; i++) model.measure(true);
  expect(model.measure().loss).toBeGreaterThan(0.15);
});

test("all toggle combinations have finite initial computations", () => {
  for (const residual of [false, true]) for (const norm of [false, true]) for (const initScale of [0.1, 0.7, 3]) {
    const result = new DeepExperiment({ residual, norm, initScale }).measure();
    expect(Number.isFinite(result.loss)).toBe(true);
    expect(result.norms.every(Number.isFinite)).toBe(true);
  }
});

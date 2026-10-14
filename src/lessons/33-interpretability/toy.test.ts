import { expect, test } from "bun:test";
import { ToyModel } from "./toy";

test("seeded training reproduces weights and updates tied parameters", () => {
  const a = new ToyModel(), b = new ToyModel();
  const initial = Array.from(a.w.data);
  for (let i = 0; i < 30; i++) { a.step(); b.step(); }
  expect(Array.from(a.w.data)).toEqual(Array.from(b.w.data));
  expect(Array.from(a.w.data)).not.toEqual(initial);
  expect(a.loss).toBeGreaterThanOrEqual(0);
});
test("dense learns two features; sparse learns more than two", () => {
  const dense = new ToyModel(5, 0, 0.7, 1);
  const sparse = new ToyModel(5, 0.95, 0.7, 1);
  for (let i = 0; i < 6000; i++) { dense.step(); sparse.step(); }
  expect(dense.metrics().represented).toBe(2);
  expect(sparse.metrics().represented).toBeGreaterThan(2);
  sparse.metrics().norms.forEach(v => { expect(v).toBeGreaterThan(0.8); expect(v).toBeLessThan(1.3); });
});
test("orthogonal columns have zero interference", () => {
  const model = new ToyModel(2);
  model.w.data.set([1, 0, 0, 1]);
  expect(model.metrics().norms).toEqual([1, 1]);
  expect(model.metrics().interference).toEqual([0, 0]);
});

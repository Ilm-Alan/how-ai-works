import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { gradient, groupAdvantages, initialLogits, metrics, step } from "./policy";
test("analytic regularized policy gradient matches finite differences", () => {
  const z = [-0.4, 0.1, 0.9, -2]; const beta = 0.7; const g = gradient(z, beta);
  const objective = (x: number[]) => { const m = metrics(x); return m.proxy - beta * m.kl; };
  for (let i = 0; i < z.length; i++) { const a = [...z]; const b = [...z]; a[i]! += 1e-5; b[i]! -= 1e-5; expect(g[i]!).toBeCloseTo((objective(a) - objective(b)) / 2e-5, 7); }
  expect(g.reduce((a, b) => a + b, 0)).toBeCloseTo(0, 12);
});
test("default proxy rises but true quality eventually falls without KL", () => {
  let z = initialLogits(); let peak = metrics(z).truth; const start = metrics(z);
  for (let i = 0; i < 3000; i++) { z = step(z, 0, 0.25); peak = Math.max(peak, metrics(z).truth); }
  const end = metrics(z);
  expect(end.proxy).toBeGreaterThan(start.proxy + 0.5);
  expect(peak).toBeGreaterThan(start.truth + 0.25);
  expect(end.truth).toBeLessThan(peak - 0.4);
});
test("large beta holds policy close to reference", () => {
  let z = initialLogits(); for (let i = 0; i < 3000; i++) z = step(z, 5, 0.25);
  expect(metrics(z).kl).toBeLessThan(0.01);
});
test("GRPO population-normalized advantages and deterministic samples", () => {
  expect(groupAdvantages([2, 2, 2])).toEqual([0, 0, 0]);
  const a = groupAdvantages([0, 1, 2]);
  expect(a.reduce((s, x) => s + x, 0)).toBeCloseTo(0, 12);
  expect(a.reduce((s, x) => s + x * x, 0) / a.length).toBeCloseTo(1, 12);
  expect(step(initialLogits(), 0.2, 0.25, rng(7))).toEqual(step(initialLogits(), 0.2, 0.25, rng(7)));
});

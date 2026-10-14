import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { KAPPA, run, surfaces } from "./opt";

const last = (a: number[]) => a[a.length - 1]!;

test("plain gradient descent converges below lr = 2/L and diverges above it", () => {
  const L = KAPPA; // largest curvature of the valley
  const ok = run(surfaces.valley, "sgd", 1.9 / L, 400, [-2.5, 1.5], 0, rng(1));
  expect(last(ok.loss)).toBeLessThan(1e-6);
  const bad = run(surfaces.valley, "sgd", 2.1 / L, 400, [-2.5, 1.5], 0, rng(1));
  expect(bad.loss.length).toBeLessThan(401);
});

test("in the valley, momentum beats plain GD at the same stable learning rate", () => {
  const lr = 0.04;
  const gd = run(surfaces.valley, "sgd", lr, 100, [-2.5, 1.5], 0, rng(1));
  const mom = run(surfaces.valley, "momentum", lr, 100, [-2.5, 1.5], 0, rng(1));
  expect(last(mom.loss)).toBeLessThan(last(gd.loss) / 10);
});

test("Adam's first step moves each coordinate by about lr, whatever the gradient scale", () => {
  const out = run(surfaces.valley, "adam", 0.1, 1, [-2.5, 1.5], 0, rng(1));
  expect(Math.abs(out.xs[1]! - out.xs[0]!)).toBeCloseTo(0.1, 6);
  expect(Math.abs(out.ys[1]! - out.ys[0]!)).toBeCloseTo(0.1, 6);
});

test("gradients match finite differences", () => {
  for (const s of Object.values(surfaces)) {
    const [x, y] = [0.3, -0.7];
    const h = 1e-6;
    const [gx, gy] = s.grad(x, y);
    expect(gx).toBeCloseTo((s.f(x + h, y) - s.f(x - h, y)) / (2 * h), 4);
    expect(gy).toBeCloseTo((s.f(x, y + h) - s.f(x, y - h)) / (2 * h), 4);
  }
});

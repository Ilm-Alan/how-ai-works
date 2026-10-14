import { expect, test } from "bun:test";
import { fitPoly, mse, predict } from "./fit";

test("recovers an exact cubic", () => {
  const xs = [-1, -0.6, -0.2, 0.1, 0.5, 0.9];
  const f = (x: number) => 2 * x ** 3 - x + 0.5;
  const w = fitPoly(xs, xs.map(f), 3, 0);
  for (const x of [-0.9, 0, 0.33, 0.8]) expect(predict(w, x)).toBeCloseTo(f(x), 6);
});

test("interpolates when degree = points - 1", () => {
  const xs = [-0.8, -0.3, 0.2, 0.7];
  const ys = [1, -2, 0.5, 3];
  expect(mse(fitPoly(xs, ys, 3, 0), xs, ys)).toBeLessThan(1e-8);
});

test("ridge penalty shrinks coefficients and raises training error", () => {
  const xs = [-1, -0.5, 0, 0.5, 1];
  const ys = [0.3, -1, 0.8, -0.4, 1.2];
  const free = fitPoly(xs, ys, 4, 0);
  const shrunk = fitPoly(xs, ys, 4, 1);
  const norm = (w: Float64Array) => Math.hypot(...w);
  expect(norm(shrunk)).toBeLessThan(norm(free));
  expect(mse(shrunk, xs, ys)).toBeGreaterThan(mse(free, xs, ys));
});

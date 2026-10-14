import { expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { logDensity, type Mixture, posterior, sample } from "./flow";

const mix: Mixture = {
  s: 0.15,
  comps: [
    { mx: -1.5, my: 0.5, w: 1, cls: 0 },
    { mx: 1.2, my: 1, w: 2, cls: 1 },
    { mx: 0.3, my: -1.4, w: 1, cls: 1 },
  ],
};

test("E[ε | x_t] = −t · ∇ log p_t(x) (Tweedie), checked by finite differences", () => {
  const h = 1e-5;
  for (const [x, y, t] of [
    [0.2, 0.1, 0.5],
    [-1, 0.4, 0.2],
    [1.5, -0.7, 0.9],
  ] as const) {
    const gx = (logDensity(mix, x + h, y, t) - logDensity(mix, x - h, y, t)) / (2 * h);
    const gy = (logDensity(mix, x, y + h, t) - logDensity(mix, x, y - h, t)) / (2 * h);
    const { eps } = posterior(mix, x, y, t);
    expect(eps[0]).toBeCloseTo(-t * gx, 5);
    expect(eps[1]).toBeCloseTo(-t * gy, 5);
  }
});

test("x_t = (1 − t)·E[x0|x_t] + t·E[ε|x_t]", () => {
  const p = posterior(mix, 0.4, -0.3, 0.6);
  expect(0.4 * p.x0[0] + 0.6 * p.eps[0]).toBeCloseTo(0.4, 10);
  expect(0.4 * p.x0[1] + 0.6 * p.eps[1]).toBeCloseTo(-0.3, 10);
});

function moments(frame: Float64Array) {
  const n = frame.length / 2;
  let mx = 0;
  let my = 0;
  for (let i = 0; i < n; i++) {
    mx += frame[2 * i]! / n;
    my += frame[2 * i + 1]! / n;
  }
  return { mx, my };
}

test("many-step ODE sampling reproduces the mixture's component weights and mean", () => {
  const r = rng(3);
  const n = 3000;
  const noise = Float64Array.from({ length: 2 * n }, () => r.normal());
  const frames = sample(mix, noise, 200);
  const out = frames[frames.length - 1]!;
  const counts = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const x = out[2 * i]!;
    const y = out[2 * i + 1]!;
    let best = 0;
    let bestD = Infinity;
    mix.comps.forEach((c, k) => {
      const d = (x - c.mx) ** 2 + (y - c.my) ** 2;
      if (d < bestD) [best, bestD] = [k, d];
    });
    counts[best]!++;
  }
  expect(counts[0]! / n).toBeCloseTo(0.25, 1);
  expect(counts[1]! / n).toBeCloseTo(0.5, 1);
  const trueMean = { mx: (-1.5 + 2 * 1.2 + 0.3) / 4, my: (0.5 + 2 + -1.4) / 4 };
  const m = moments(out);
  expect(Math.abs(m.mx - trueMean.mx)).toBeLessThan(0.06);
  expect(Math.abs(m.my - trueMean.my)).toBeLessThan(0.06);
});

test("guidance with scale 1 samples only the requested class", () => {
  const r = rng(4);
  const noise = Float64Array.from({ length: 400 }, () => r.normal());
  const frames = sample(mix, noise, 100, { cls: 0, scale: 1 });
  const out = frames[frames.length - 1]!;
  for (let i = 0; i < 200; i++) expect(Math.hypot(out[2 * i]! + 1.5, out[2 * i + 1]! - 0.5)).toBeLessThan(0.8);
});

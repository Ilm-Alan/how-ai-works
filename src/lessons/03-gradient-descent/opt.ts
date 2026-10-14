import type { Rng } from "../../lib/rng";

export interface Surface {
  label: string;
  f(x: number, y: number): number;
  grad(x: number, y: number): [number, number];
  x: [number, number];
  y: [number, number];
  start: [number, number];
  min: [number, number];
}

export const KAPPA = 20;

export const surfaces: Record<"bowl" | "valley" | "rosenbrock", Surface> = {
  bowl: {
    label: "round bowl",
    f: (x, y) => 0.5 * (x * x + y * y),
    grad: (x, y) => [x, y],
    x: [-3, 3],
    y: [-3, 3],
    start: [-2.5, 2],
    min: [0, 0],
  },
  valley: {
    // Curvature 1 along x, KAPPA along y: condition number KAPPA.
    label: `narrow valley (curvature ratio ${KAPPA})`,
    f: (x, y) => 0.5 * (x * x + KAPPA * y * y),
    grad: (x, y) => [x, KAPPA * y],
    x: [-3, 3],
    y: [-3, 3],
    start: [-2.5, 1.5],
    min: [0, 0],
  },
  rosenbrock: {
    label: "curved valley (Rosenbrock)",
    f: (x, y) => (1 - x) ** 2 + 10 * (y - x * x) ** 2,
    grad: (x, y) => [-2 * (1 - x) - 40 * x * (y - x * x), 20 * (y - x * x)],
    x: [-2, 2],
    y: [-1, 3],
    start: [-1.5, 2.5],
    min: [1, 1],
  },
};

export type OptName = "sgd" | "momentum" | "adam";

/**
 * Runs `steps` updates from `start`. `noise` adds Gaussian noise of that standard deviation to each gradient
 * component, standing in for minibatch sampling noise. Stops early if the iterate diverges.
 */
export function run(
  s: Surface,
  opt: OptName,
  lr: number,
  steps: number,
  start: [number, number],
  noise: number,
  r: Rng,
): { xs: number[]; ys: number[]; loss: number[] } {
  let [x, y] = start;
  const xs = [x];
  const ys = [y];
  const loss = [s.f(x, y)];
  let vx = 0;
  let vy = 0;
  let mx = 0;
  let my = 0;
  const b1 = 0.9;
  const b2 = 0.999;
  for (let t = 1; t <= steps; t++) {
    let [gx, gy] = s.grad(x, y);
    gx += noise * r.normal();
    gy += noise * r.normal();
    if (opt === "sgd") {
      x -= lr * gx;
      y -= lr * gy;
    } else if (opt === "momentum") {
      vx = 0.9 * vx + gx;
      vy = 0.9 * vy + gy;
      x -= lr * vx;
      y -= lr * vy;
    } else {
      mx = b1 * mx + (1 - b1) * gx;
      my = b1 * my + (1 - b1) * gy;
      vx = b2 * vx + (1 - b2) * gx * gx;
      vy = b2 * vy + (1 - b2) * gy * gy;
      const c1 = 1 - b1 ** t;
      const c2 = 1 - b2 ** t;
      x -= (lr * (mx / c1)) / (Math.sqrt(vx / c2) + 1e-8);
      y -= (lr * (my / c1)) / (Math.sqrt(vy / c2) + 1e-8);
    }
    const f = s.f(x, y);
    if (!Number.isFinite(f) || f > 1e8) break;
    xs.push(x);
    ys.push(y);
    loss.push(f);
  }
  return { xs, ys, loss };
}

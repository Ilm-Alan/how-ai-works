// Rectified-flow noising of a 2D Gaussian mixture, with the exact (Bayes-optimal) velocity field.
// x_t = (1 - t)·x0 + t·ε, t = 0 is data, t = 1 is pure noise ε ~ N(0, I).
// A trained network approximates exactly this field; here the data distribution is known, so we compute it.

export interface Component {
  mx: number;
  my: number;
  /** Mixture weight; need not be normalized. */
  w: number;
  /** Class label used for guidance. */
  cls: number;
}

export interface Mixture {
  comps: Component[];
  /** Standard deviation of every component. */
  s: number;
}

export interface Posterior {
  /** E[x0 | x_t]. */
  x0: [number, number];
  /** E[ε | x_t]. */
  eps: [number, number];
  /** Velocity dx_t/dt = E[ε − x0 | x_t]. */
  v: [number, number];
}

/** Exact posterior means at (x, y, t), optionally restricted to one class (for conditional generation). */
export function posterior(m: Mixture, x: number, y: number, t: number, cls?: number): Posterior {
  const a = 1 - t;
  const var_ = a * a * m.s * m.s + t * t;
  // Log-sum-exp over components for numerically stable responsibilities.
  let maxL = -Infinity;
  const logs: number[] = [];
  for (const c of m.comps) {
    if (cls !== undefined && c.cls !== cls) {
      logs.push(-Infinity);
      continue;
    }
    const dx = x - a * c.mx;
    const dy = y - a * c.my;
    const l = Math.log(c.w) - (dx * dx + dy * dy) / (2 * var_);
    logs.push(l);
    maxL = Math.max(maxL, l);
  }
  let z = 0;
  let x0x = 0;
  let x0y = 0;
  let ex = 0;
  let ey = 0;
  m.comps.forEach((c, k) => {
    const r = Math.exp(logs[k]! - maxL);
    if (r === 0) return;
    z += r;
    const dx = x - a * c.mx;
    const dy = y - a * c.my;
    // Gaussian conditioning: x0 and ε given x_t within one component.
    x0x += r * (c.mx + ((a * m.s * m.s) / var_) * dx);
    x0y += r * (c.my + ((a * m.s * m.s) / var_) * dy);
    ex += r * ((t / var_) * dx);
    ey += r * ((t / var_) * dy);
  });
  const x0: [number, number] = [x0x / z, x0y / z];
  const eps: [number, number] = [ex / z, ey / z];
  return { x0, eps, v: [eps[0] - x0[0], eps[1] - x0[1]] };
}

/** Log density of x_t (up to the shared normalizing constant, which cancels in gradients). */
export function logDensity(m: Mixture, x: number, y: number, t: number): number {
  const a = 1 - t;
  const var_ = a * a * m.s * m.s + t * t;
  let total = 0;
  let wsum = 0;
  for (const c of m.comps) {
    const dx = x - a * c.mx;
    const dy = y - a * c.my;
    total += (c.w * Math.exp(-(dx * dx + dy * dy) / (2 * var_))) / var_;
    wsum += c.w;
  }
  return Math.log(total / wsum);
}

/**
 * Integrates the probability-flow ODE from t = 1 to t = 0 with `steps` Euler steps.
 * With guidance scale g and a class, the velocity is v_uncond + g·(v_cond − v_uncond) (classifier-free guidance; g = 1 is plain conditional).
 * Returns positions after every step: frames[k] has 2·n numbers.
 */
export function sample(
  m: Mixture,
  noise: Float64Array,
  steps: number,
  guide?: { cls: number; scale: number },
): Float64Array[] {
  const n = noise.length / 2;
  let cur = Float64Array.from(noise);
  const frames = [cur];
  const dt = 1 / steps;
  for (let k = 0; k < steps; k++) {
    const t = 1 - k * dt;
    const next = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) {
      const x = cur[2 * i]!;
      const y = cur[2 * i + 1]!;
      let [vx, vy] = posterior(m, x, y, t).v;
      if (guide) {
        const [cx, cy] = posterior(m, x, y, t, guide.cls).v;
        vx += guide.scale * (cx - vx);
        vy += guide.scale * (cy - vy);
      }
      next[2 * i] = x - vx * dt;
      next[2 * i + 1] = y - vy * dt;
    }
    frames.push(next);
    cur = next;
  }
  return frames;
}

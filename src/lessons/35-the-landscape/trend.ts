// Least-squares fit of log10(value) against time in years: value = 10^(a + b·t).

export interface Fit {
  a: number;
  b: number;
  n: number;
  /** Residual standard deviation in log10 units. */
  sd: number;
  meanT: number;
  sxx: number;
}

export function fitExp(t: number[], v: number[]): Fit {
  const n = t.length;
  const y = v.map(Math.log10);
  const meanT = t.reduce((s, x) => s + x, 0) / n;
  const meanY = y.reduce((s, x) => s + x, 0) / n;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sxx += (t[i]! - meanT) ** 2;
    sxy += (t[i]! - meanT) * (y[i]! - meanY);
  }
  const b = sxy / sxx;
  const a = meanY - b * meanT;
  let rss = 0;
  for (let i = 0; i < n; i++) rss += (y[i]! - a - b * t[i]!) ** 2;
  return { a, b, n, sd: n > 2 ? Math.sqrt(rss / (n - 2)) : 0, meanT, sxx };
}

/** Doubling time in days for a fit in years. */
export function doublingDays(f: Fit): number {
  return (Math.log10(2) / f.b) * 365.25;
}

/** Approximate 95% prediction band (log10 units) at time t: widens with distance from the data's center. */
export function bandHalfWidth(f: Fit, t: number): number {
  return 2 * f.sd * Math.sqrt(1 + 1 / f.n + (t - f.meanT) ** 2 / f.sxx);
}

export function yearOf(iso: string): number {
  const d = new Date(`${iso}T00:00:00Z`);
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  const end = Date.UTC(d.getUTCFullYear() + 1, 0, 1);
  return d.getUTCFullYear() + (d.getTime() - start) / (end - start);
}

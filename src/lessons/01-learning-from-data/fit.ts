// Ridge regression on Legendre polynomial features over x in [-1, 1].
// Legendre features keep the normal equations well conditioned up to degree ~20.

/** Fills `out` with P_0(x) .. P_deg(x). */
function legendre(x: number, deg: number, out: Float64Array): void {
  out[0] = 1;
  if (deg >= 1) out[1] = x;
  for (let n = 1; n < deg; n++) out[n + 1] = ((2 * n + 1) * x * out[n]! - n * out[n - 1]!) / (n + 1);
}

/** Coefficients minimizing sum (y - w·phi(x))^2 + lambda * |w|^2. */
export function fitPoly(xs: ArrayLike<number>, ys: ArrayLike<number>, deg: number, lambda: number): Float64Array {
  const p = deg + 1;
  const A = new Float64Array(p * p);
  const b = new Float64Array(p);
  const phi = new Float64Array(p);
  for (let i = 0; i < xs.length; i++) {
    legendre(xs[i]!, deg, phi);
    for (let r = 0; r < p; r++) {
      b[r]! += phi[r]! * ys[i]!;
      for (let c = 0; c < p; c++) A[r * p + c]! += phi[r]! * phi[c]!;
    }
  }
  // A tiny floor keeps the system solvable when degree exceeds the number of points (minimum-norm-like solution).
  for (let r = 0; r < p; r++) A[r * p + r]! += lambda + 1e-10;
  return solveSPD(A, b, p);
}

export function predict(w: Float64Array, x: number): number {
  const phi = new Float64Array(w.length);
  legendre(x, w.length - 1, phi);
  let y = 0;
  for (let i = 0; i < w.length; i++) y += w[i]! * phi[i]!;
  return y;
}

export function mse(w: Float64Array, xs: ArrayLike<number>, ys: ArrayLike<number>): number {
  let s = 0;
  for (let i = 0; i < xs.length; i++) s += (predict(w, xs[i]!) - ys[i]!) ** 2;
  return s / xs.length;
}

/** Cholesky solve of a symmetric positive-definite system. */
function solveSPD(A: Float64Array, b: Float64Array, n: number): Float64Array {
  const L = new Float64Array(n * n);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= i; j++) {
      let s = A[i * n + j]!;
      for (let k = 0; k < j; k++) s -= L[i * n + k]! * L[j * n + k]!;
      L[i * n + j] = i === j ? Math.sqrt(Math.max(s, 1e-300)) : s / L[j * n + j]!;
    }
  }
  const z = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    let s = b[i]!;
    for (let k = 0; k < i; k++) s -= L[i * n + k]! * z[k]!;
    z[i] = s / L[i * n + i]!;
  }
  const x = new Float64Array(n);
  for (let i = n - 1; i >= 0; i--) {
    let s = z[i]!;
    for (let k = i + 1; k < n; k++) s -= L[k * n + i]! * x[k]!;
    x[i] = s / L[i * n + i]!;
  }
  return x;
}

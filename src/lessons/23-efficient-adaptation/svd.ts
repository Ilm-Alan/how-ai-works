// Singular value decomposition by one-sided Jacobi rotations. Accurate and simple; fine for matrices up to ~128×128.

export interface SVD {
  /** m×k, column-major by singular vector: U[i * k + c]. */
  U: Float64Array;
  /** Singular values, descending. */
  S: Float64Array;
  /** n×k: V[j * k + c]. */
  V: Float64Array;
  m: number;
  n: number;
  k: number;
}

/** A is m×n row-major with m >= n. */
export function svd(A: ArrayLike<number>, m: number, n: number): SVD {
  if (m < n) throw new Error("svd expects m >= n; transpose first");
  // Work on columns: W[c] is column c of A (length m), V starts as identity.
  const W = Array.from({ length: n }, (_, c) => Float64Array.from({ length: m }, (_, i) => A[i * n + c]!));
  const Vc = Array.from({ length: n }, (_, c) => Float64Array.from({ length: n }, (_, j) => (j === c ? 1 : 0)));
  for (let sweep = 0; sweep < 60; sweep++) {
    let rotated = false;
    for (let p = 0; p < n - 1; p++) {
      for (let q = p + 1; q < n; q++) {
        const a = W[p]!;
        const b = W[q]!;
        let alpha = 0;
        let beta = 0;
        let gamma = 0;
        for (let i = 0; i < m; i++) {
          alpha += a[i]! * a[i]!;
          beta += b[i]! * b[i]!;
          gamma += a[i]! * b[i]!;
        }
        if (Math.abs(gamma) <= 1e-15 * Math.sqrt(alpha * beta) || gamma === 0) continue;
        rotated = true;
        const zeta = (beta - alpha) / (2 * gamma);
        const t = Math.sign(zeta || 1) / (Math.abs(zeta) + Math.sqrt(1 + zeta * zeta));
        const c = 1 / Math.sqrt(1 + t * t);
        const s = c * t;
        for (let i = 0; i < m; i++) {
          const x = a[i]!;
          const y = b[i]!;
          a[i] = c * x - s * y;
          b[i] = s * x + c * y;
        }
        const va = Vc[p]!;
        const vb = Vc[q]!;
        for (let j = 0; j < n; j++) {
          const x = va[j]!;
          const y = vb[j]!;
          va[j] = c * x - s * y;
          vb[j] = s * x + c * y;
        }
      }
    }
    if (!rotated) break;
  }
  const norms = W.map((col) => Math.hypot(...col));
  const order = norms.map((_, i) => i).sort((x, y) => norms[y]! - norms[x]!);
  const k = n;
  const U = new Float64Array(m * k);
  const S = new Float64Array(k);
  const V = new Float64Array(n * k);
  order.forEach((src, c) => {
    const sigma = norms[src]!;
    S[c] = sigma;
    for (let i = 0; i < m; i++) U[i * k + c] = sigma > 0 ? W[src]![i]! / sigma : 0;
    for (let j = 0; j < n; j++) V[j * k + c] = Vc[src]![j]!;
  });
  return { U, S, V, m, n, k };
}

/** Best rank-r approximation U_r S_r V_rᵀ, row-major m×n. */
export function reconstruct(d: SVD, r: number): Float64Array {
  const out = new Float64Array(d.m * d.n);
  for (let c = 0; c < Math.min(r, d.k); c++) {
    const s = d.S[c]!;
    for (let i = 0; i < d.m; i++) {
      const u = d.U[i * d.k + c]! * s;
      for (let j = 0; j < d.n; j++) out[i * d.n + j]! += u * d.V[j * d.k + c]!;
    }
  }
  return out;
}

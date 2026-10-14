export interface AttentionOptions {
  causal?: boolean;
  scale?: boolean;
  temperature?: number;
  /** Row-major additive mask: finite biases or -Infinity. */
  mask?: ArrayLike<number>;
}

/** Self-attention on row-major Q[n,d], K[n,d], V[n,dv]. */
export function attention(q: ArrayLike<number>, k: ArrayLike<number>, v: ArrayLike<number>, n: number, d: number, dv: number, options: AttentionOptions = {}) {
  if (![n, d, dv].every((x) => Number.isSafeInteger(x) && x > 0) || q.length !== n * d || k.length !== n * d || v.length !== n * dv) throw new Error("Invalid attention shapes");
  const temperature = options.temperature ?? 1;
  if (!(temperature > 0) || !Number.isFinite(temperature)) throw new Error("Temperature must be finite and positive");
  if (options.mask && options.mask.length !== n * n) throw new Error("Invalid mask shape");
  const divisor = (options.scale === false ? 1 : Math.sqrt(d)) * temperature;
  const scores = new Float64Array(n * n);
  const weights = new Float64Array(n * n);
  const output = new Float64Array(n * dv);
  for (let i = 0; i < n; i++) {
    let max = -Infinity;
    for (let j = 0; j < n; j++) {
      let dot = 0;
      for (let a = 0; a < d; a++) dot += q[i * d + a]! * k[j * d + a]!;
      const mask = options.mask?.[i * n + j] ?? 0;
      const score = options.causal && j > i ? -Infinity : dot / divisor + mask;
      if (!Number.isFinite(score) && score !== -Infinity) throw new Error("Invalid attention score");
      scores[i * n + j] = score;
      max = Math.max(max, score);
    }
    if (max === -Infinity) throw new Error("An attention row has no allowed keys");
    let sum = 0;
    for (let j = 0; j < n; j++) {
      const weight = Math.exp(scores[i * n + j]! - max);
      weights[i * n + j] = weight;
      sum += weight;
    }
    for (let j = 0; j < n; j++) {
      const weight = weights[i * n + j]! / sum;
      weights[i * n + j] = weight;
      for (let a = 0; a < dv; a++) output[i * dv + a]! += weight * v[j * dv + a]!;
    }
  }
  return { scores, weights, output };
}

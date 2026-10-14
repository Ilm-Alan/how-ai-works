/** Adjacent dimension pairs, as in Meta's complex-valued RoPE implementation. */
export function rope(x: ArrayLike<number>, position: number, base = 10000): Float64Array {
  if (x.length === 0 || x.length % 2 || !Number.isFinite(position) || !(base > 0) || !Number.isFinite(base)) throw new Error("RoPE needs even dimensions, finite position, and positive base");
  const out = new Float64Array(x.length);
  for (let i = 0; i < x.length / 2; i++) {
    const angle = position * base ** (-2 * i / x.length);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    out[2 * i] = x[2 * i]! * c - x[2 * i + 1]! * s;
    out[2 * i + 1] = x[2 * i]! * s + x[2 * i + 1]! * c;
  }
  return out;
}

export function dot(a: ArrayLike<number>, b: ArrayLike<number>): number {
  if (a.length !== b.length) throw new Error("Dot product shapes differ");
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += a[i]! * b[i]!;
  return sum;
}

export interface Config {
  width: number;
  layers: number;
  heads: number;
  kvHeads: number;
  vocab: number;
  mlpWidth: number;
  mlp: "swiglu" | "classic";
  tied: boolean;
}

/** Bias-free dense decoder: two RMSNorm gains per block and one final gain. */
export function parameterCount(c: Config) {
  if (![c.width, c.layers, c.heads, c.kvHeads, c.vocab, c.mlpWidth].every((v) => Number.isSafeInteger(v) && v > 0) || c.width % c.heads || c.heads % c.kvHeads) throw new Error("Invalid decoder configuration");
  const headDim = c.width / c.heads;
  const kvWidth = c.kvHeads * headDim;
  const attentionPerLayer = 2 * c.width ** 2 + 2 * c.width * kvWidth;
  const mlpPerLayer = (c.mlp === "swiglu" ? 3 : 2) * c.width * c.mlpWidth;
  const embeddings = (c.tied ? 1 : 2) * c.vocab * c.width;
  const attention = c.layers * attentionPerLayer;
  const mlp = c.layers * mlpPerLayer;
  const norms = (2 * c.layers + 1) * c.width;
  const total = embeddings + attention + mlp + norms;
  if (!Number.isSafeInteger(total)) throw new Error("Parameter count exceeds exact integer range");
  return { total, embeddings, attention, mlp, norms, attentionPerLayer, mlpPerLayer, headDim, kvWidth };
}

// Published Llama 3 8B dimensions; exact vocab from the linked HF config mirror.
export const LLAMA3_8B: Config = {
  width: 4096, layers: 32, heads: 32, kvHeads: 8,
  vocab: 128256, mlpWidth: 14336, mlp: "swiglu", tied: false,
};

/** Softmax of `logits / temperature`, computed stably by subtracting the max. */
export function softmax(logits: ArrayLike<number>, temperature = 1): number[] {
  let max = -Infinity;
  for (let i = 0; i < logits.length; i++) max = Math.max(max, logits[i]! / temperature);
  const out = Array.from(logits, (z) => Math.exp(z / temperature - max));
  const total = out.reduce((s, v) => s + v, 0);
  return out.map((v) => v / total);
}

/** Shannon entropy in bits. */
export function entropyBits(p: ArrayLike<number>): number {
  let h = 0;
  for (let i = 0; i < p.length; i++) if (p[i]! > 0) h -= p[i]! * Math.log2(p[i]!);
  return h;
}

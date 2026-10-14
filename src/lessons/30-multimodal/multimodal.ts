import { rng } from "../../lib/rng";

export function patches(width: number, height: number, size: number) {
  for (const v of [width, height, size]) {
    if (!Number.isSafeInteger(v) || v <= 0) throw new Error("Positive integer dimensions required");
  }
  const cols = Math.ceil(width / size);
  const rows = Math.ceil(height / size);
  return { cols, rows, tokens: cols * rows, paddedWidth: cols * size, paddedHeight: rows * size };
}

/** OpenAI's documented GPT-4.1 high-detail tile accounting, accessed Oct 2026. */
export function providerTokens(width: number, height: number) {
  patches(width, height, 512);
  const fit = Math.min(1, 2048 / Math.max(width, height));
  let w = Math.max(1, Math.floor(width * fit));
  let h = Math.max(1, Math.floor(height * fit));
  if (Math.min(w, h) > 768) {
    const scale = 768 / Math.min(w, h);
    w = Math.floor(w * scale);
    h = Math.floor(h * scale);
  }
  const tiles = patches(w, h, 512).tokens;
  return { width: w, height: h, tiles, tokens: 85 + 170 * tiles };
}

/** Stable row/column softmax; diagonal pairs are the targets. Scores are unscaled similarities. */
export function clipLoss(scores: readonly (readonly number[])[], temperature: number) {
  const n = scores.length;
  if (!n || scores.some(row => row.length !== n || row.some(x => !Number.isFinite(x))) || !Number.isFinite(temperature) || temperature <= 0) {
    throw new Error("Square finite scores and positive temperature required");
  }
  const rowProb = Array.from({ length: n }, () => Array<number>(n).fill(0));
  const colProb = Array.from({ length: n }, () => Array<number>(n).fill(0));
  let imageLoss = 0;
  let textLoss = 0;
  for (let i = 0; i < n; i++) {
    for (const transpose of [false, true]) {
      const logits = Array.from({ length: n }, (_, j) => (transpose ? scores[j]![i]! : scores[i]![j]!) / temperature);
      const max = Math.max(...logits);
      const exps = logits.map(x => Math.exp(x - max));
      const sum = exps.reduce((a, b) => a + b, 0);
      const loss = max - logits[i]! + Math.log(sum);
      if (transpose) textLoss += loss / n;
      else imageLoss += loss / n;
      for (let j = 0; j < n; j++) {
        if (transpose) colProb[j]![i] = exps[j]! / sum;
        else rowProb[i]![j] = exps[j]! / sum;
      }
    }
  }
  return { imageLoss, textLoss, loss: (imageLoss + textLoss) / 2, rowProb, colProb };
}

/** Synthetic unit-vector batch, not pretrained image/text embeddings. */
export function similarityBatch(seed: number, noise: number, swapped: boolean) {
  const r = rng(seed);
  const normalize = (v: number[]) => {
    const length = Math.hypot(...v);
    return v.map(x => x / length);
  };
  const images = Array.from({ length: 4 }, () => normalize(Array.from({ length: 8 }, () => r.normal())));
  const texts = images.map(v => normalize(v.map(x => x + noise * r.normal())));
  if (swapped) [texts[0], texts[1]] = [texts[1]!, texts[0]!];
  return images.map(v => texts.map(t => v.reduce((sum, x, k) => sum + x * t[k]!, 0)));
}

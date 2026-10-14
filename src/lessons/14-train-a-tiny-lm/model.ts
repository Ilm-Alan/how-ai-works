import { rng, type Rng } from "../../lib/rng";
import { Tensor, AdamW, add, scale, matmul, embedding, rmsNorm, causalSelfAttention, gelu, crossEntropy, randn, param } from "../../lib/tensor";

export interface Config { layers: number; width: number; context: number; lr: number; batch: number }
export const defaults: Config = { layers: 1, width: 32, context: 32, lr: 0.003, batch: 4 };
export interface Corpus { chars: string[]; train: Int32Array; validation: Int32Array; ids: Map<string, number> }

export function corpus(text: string, context: number): Corpus {
  const characters = Array.from(text);
  const split = Math.floor(characters.length * 0.9);
  if (split <= context || characters.length - split <= context) throw new Error(`Need at least ${10 * (context + 1)} characters: the final 10% must contain a full context and target.`);
  const chars = [...new Set(characters)].sort();
  const ids = new Map(chars.map((c, i) => [c, i]));
  const encoded = Int32Array.from(characters, c => ids.get(c)!);
  return { chars, ids, train: encoded.slice(0, split), validation: encoded.slice(split) };
}

/** Greedy at zero; stable softmax sampling otherwise. Ties select the first maximum. */
export function sampleToken(logits: ArrayLike<number>, temperature: number, r: Rng): number {
  let best = 0;
  for (let i = 1; i < logits.length; i++) if (logits[i]! > logits[best]!) best = i;
  if (temperature <= 1e-6) return best;
  const maximum = logits[best]!;
  let total = 0;
  for (let i = 0; i < logits.length; i++) total += Math.exp((logits[i]! - maximum) / temperature);
  let threshold = r.next() * total;
  for (let i = 0; i < logits.length; i++) {
    threshold -= Math.exp((logits[i]! - maximum) / temperature);
    if (threshold <= 0) return i;
  }
  return best;
}

interface Block { attnNorm: Tensor; q: Tensor; k: Tensor; v: Tensor; out: Tensor; mlpNorm: Tensor; up: Tensor; down: Tensor }
export class TinyLM {
  readonly params: Tensor[] = [];
  readonly heads = 2;
  readonly optimizer: AdamW;
  private readonly token: Tensor;
  private readonly position: Tensor;
  private readonly blocks: Block[];
  private readonly finalNorm: Tensor;
  private readonly head: Tensor;
  private readonly positions: Int32Array;
  private readonly random: Rng;
  steps = 0;

  constructor(readonly vocab: number, readonly config: Config = defaults, seed = 14) {
    const { width: d, context, layers } = config;
    if (![1, 2].includes(layers) || d < 4 || d % this.heads || context < 2 || config.batch < 1) throw new Error("Use 1–2 layers, an even width, context ≥ 2, and batch ≥ 1.");
    this.random = rng(seed);
    const weight = (rows: number, cols: number, std: number) => {
      const p = randn(rows, cols, std, this.random); this.params.push(p); return p;
    };
    const gain = () => { const p = param(new Float32Array(d).fill(1), 1, d); this.params.push(p); return p; };
    this.token = weight(vocab, d, 0.1);
    this.position = weight(context, d, 0.02);
    this.positions = Int32Array.from({ length: context }, (_, i) => i);
    this.blocks = Array.from({ length: layers }, () => ({
      attnNorm: gain(), q: weight(d, d, 1 / Math.sqrt(d)), k: weight(d, d, 1 / Math.sqrt(d)), v: weight(d, d, 1 / Math.sqrt(d)),
      out: weight(d, d, 0.2 / Math.sqrt(d * layers)), mlpNorm: gain(),
      up: weight(d, 2 * d, 1 / Math.sqrt(d)), down: weight(2 * d, d, 0.2 / Math.sqrt(2 * d * layers)),
    }));
    this.finalNorm = gain();
    this.head = weight(d, vocab, 0.02);
    this.optimizer = new AdamW(this.params, config.lr, { weightDecay: 0.01 });
  }

  get parameterCount(): number { return this.params.reduce((n, p) => n + p.data.length, 0); }

  forward(ids: Int32Array, attention?: Float32Array[][]): Tensor {
    if (!ids.length || ids.length > this.config.context) throw new Error("Sequence must fit the model context.");
    let x = add(embedding(this.token, ids), embedding(this.position, this.positions.subarray(0, ids.length)));
    for (let i = 0; i < this.blocks.length; i++) {
      const b = this.blocks[i]!;
      const weights = attention ? [] as Float32Array[] : undefined;
      x = add(x, causalSelfAttention(rmsNorm(x, b.attnNorm), b.q, b.k, b.v, b.out, this.heads, weights));
      if (attention) attention[i] = weights!;
      x = add(x, matmul(gelu(matmul(rmsNorm(x, b.mlpNorm), b.up)), b.down));
    }
    return matmul(rmsNorm(x, this.finalNorm), this.head);
  }

  /** Separate causal sequences; accumulated gradients form one averaged minibatch. */
  train(data: Int32Array): number {
    const { context, batch } = this.config;
    this.optimizer.zeroGrad();
    let loss = 0;
    for (let b = 0; b < batch; b++) {
      const start = this.random.int(data.length - context);
      const value = crossEntropy(this.forward(data.subarray(start, start + context)), data.subarray(start + 1, start + context + 1));
      loss += value.data[0]! / batch;
      scale(value, 1 / batch).backward();
    }
    this.optimizer.step(); this.steps++;
    return loss;
  }

  /** Evaluation does not retain a training graph or change optimizer / training RNG. */
  inference<T>(fn: () => T): T {
    for (const p of this.params) p.requiresGrad = false;
    try { return fn(); } finally { for (const p of this.params) p.requiresGrad = true; }
  }

  evaluate(data: Int32Array, windows = 16): number {
    return this.inference(() => {
      let loss = 0;
      const t = this.config.context;
      for (let i = 0; i < windows; i++) {
        const start = Math.floor(i * (data.length - t - 1) / Math.max(1, windows - 1));
        loss += crossEntropy(this.forward(data.subarray(start, start + t)), data.subarray(start + 1, start + t + 1)).data[0]!;
      }
      return loss / windows;
    });
  }

  prompt(text: string, data: Corpus): Int32Array {
    const fallback = data.ids.get(" ") ?? 0;
    const ids = Array.from(text).slice(-this.config.context).map(c => data.ids.get(c) ?? fallback);
    return Int32Array.from(ids.length ? ids : [fallback]);
  }

  generateTokens(prompt: Int32Array, temperature: number, r: Rng): { next(): number } {
    const context = Array.from(prompt);
    return { next: () => this.inference(() => {
      const logits = this.forward(Int32Array.from(context));
      const next = sampleToken(logits.data.subarray((logits.rows - 1) * this.vocab), temperature, r);
      context.push(next);
      if (context.length > this.config.context) context.shift();
      return next;
    }) };
  }

  generate(prompt: string, data: Corpus, count = 180, temperature = 0.8, seed = 140): string {
    const tokens = this.generateTokens(this.prompt(prompt, data), temperature, rng(seed));
    let result = prompt;
    for (let i = 0; i < count; i++) result += data.chars[tokens.next()]!;
    return result;
  }

  attention(prompt: string, data: Corpus, layer: number, head: number): { ids: Int32Array; weights: Float32Array } {
    return this.inference(() => {
      const ids = this.prompt(prompt, data), weights: Float32Array[][] = [];
      this.forward(ids, weights);
      return { ids, weights: weights[layer]![head]! };
    });
  }
}

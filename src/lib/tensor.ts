import type { Rng } from "./rng";

/** Row-major 2D tensor; do not mutate input data between forward and backward. */
export class Tensor {
  grad: Float32Array;
  /** @internal */ _parents: Tensor[] = [];
  /** @internal */ _backward: (() => void) | null = null;

  constructor(
    public data: Float32Array,
    public rows: number,
    public cols: number,
    public requiresGrad = false,
  ) {
    if (!Number.isSafeInteger(rows) || !Number.isSafeInteger(cols) || rows <= 0 || cols <= 0 || data.length !== rows * cols) {
      throw new Error("Tensor requires positive dimensions matching its data length");
    }
    this.grad = new Float32Array(data.length);
  }

  backward(): void {
    if (this.rows !== 1 || this.cols !== 1) throw new Error("backward requires a scalar tensor");
    if (!this.requiresGrad) return;
    // Iterative postorder handles shared parents and arbitrarily deep graphs.
    const order: Tensor[] = [];
    const stack: Tensor[] = [this];
    const indices: number[] = [0];
    const visited = new Set<Tensor>([this]);
    while (stack.length) {
      const node = stack[stack.length - 1]!;
      const i = indices[indices.length - 1]!;
      if (i < node._parents.length) {
        indices[indices.length - 1] = i + 1;
        const parent = node._parents[i]!;
        if (parent.requiresGrad && !visited.has(parent)) {
          visited.add(parent);
          stack.push(parent);
          indices.push(0);
        }
      } else {
        order.push(node);
        stack.pop();
        indices.pop();
      }
    }
    // Leaf gradients accumulate across calls; intermediates belong to this pass.
    for (const node of order) if (node._backward) node.grad.fill(0);
    if (this._backward) this.grad[0] = 1;
    else this.grad[0] = this.grad[0]! + 1;
    for (let i = order.length - 1; i >= 0; i--) order[i]!._backward?.();
  }

  zeroGrad(): void { this.grad.fill(0); }
}

export function tensor(data: ArrayLike<number>, rows: number, cols: number, requiresGrad = false): Tensor {
  return new Tensor(Float32Array.from(data), rows, cols, requiresGrad);
}
export function zeros(rows: number, cols: number, requiresGrad = false): Tensor {
  return new Tensor(new Float32Array(rows * cols), rows, cols, requiresGrad);
}
export function randn(rows: number, cols: number, std: number, r: Rng, requiresGrad = true): Tensor {
  const out = zeros(rows, cols, requiresGrad);
  for (let i = 0; i < out.data.length; i++) out.data[i] = r.normal() * std;
  return out;
}
export function param(data: ArrayLike<number>, rows: number, cols: number): Tensor {
  return tensor(data, rows, cols, true);
}

function track(out: Tensor, parents: Tensor[], backward: () => void): Tensor {
  out.requiresGrad = parents.some(p => p.requiresGrad);
  if (out.requiresGrad) { out._parents = parents; out._backward = backward; }
  return out;
}
function sameShape(a: Tensor, b: Tensor): void {
  if (a.rows !== b.rows || a.cols !== b.cols) throw new Error("Tensor shapes must match");
}

// i-k-j traversal keeps the innermost dimension contiguous.
function mm(a: Float32Array, b: Float32Array, out: Float32Array, m: number, k: number, n: number): void {
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      const av = a[i * k + p]!;
      for (let j = 0; j < n; j++) {
        const o = i * n + j;
        out[o] = out[o]! + av * b[p * n + j]!;
      }
    }
  }
}
function mmBackward(a: Float32Array, b: Float32Array, g: Float32Array, ga: Float32Array | null, gb: Float32Array | null, m: number, k: number, n: number): void {
  for (let i = 0; i < m; i++) {
    for (let p = 0; p < k; p++) {
      let da = 0;
      const av = a[i * k + p]!;
      for (let j = 0; j < n; j++) {
        const dy = g[i * n + j]!;
        if (ga) da += dy * b[p * n + j]!;
        if (gb) {
          const bi = p * n + j;
          gb[bi] = gb[bi]! + av * dy;
        }
      }
      if (ga) {
        const ai = i * k + p;
        ga[ai] = ga[ai]! + da;
      }
    }
  }
}
export function matmul(a: Tensor, b: Tensor): Tensor {
  if (a.cols !== b.rows) throw new Error("matmul inner dimensions must match");
  const out = zeros(a.rows, b.cols);
  mm(a.data, b.data, out.data, a.rows, a.cols, b.cols);
  return track(out, [a, b], () => mmBackward(a.data, b.data, out.grad, a.requiresGrad ? a.grad : null, b.requiresGrad ? b.grad : null, a.rows, a.cols, b.cols));
}
function addSub(a: Tensor, b: Tensor, sign: number): Tensor {
  if (a.cols !== b.cols || (a.rows !== b.rows && b.rows !== 1)) throw new Error("Expected same shape or row-broadcast RHS");
  const out = zeros(a.rows, a.cols);
  const broadcast = b.rows === 1;
  for (let i = 0; i < out.data.length; i++) out.data[i] = a.data[i]! + sign * b.data[broadcast ? i % a.cols : i]!;
  return track(out, [a, b], () => {
    for (let i = 0; i < out.data.length; i++) {
      const g = out.grad[i]!;
      if (a.requiresGrad) a.grad[i] = a.grad[i]! + g;
      if (b.requiresGrad) {
        const j = broadcast ? i % a.cols : i;
        b.grad[j] = b.grad[j]! + sign * g;
      }
    }
  });
}
export function add(a: Tensor, b: Tensor): Tensor { return addSub(a, b, 1); }
export function sub(a: Tensor, b: Tensor): Tensor { return addSub(a, b, -1); }
export function mul(a: Tensor, b: Tensor): Tensor {
  sameShape(a, b);
  const out = zeros(a.rows, a.cols);
  for (let i = 0; i < out.data.length; i++) out.data[i] = a.data[i]! * b.data[i]!;
  return track(out, [a, b], () => {
    for (let i = 0; i < out.data.length; i++) {
      if (a.requiresGrad) a.grad[i] = a.grad[i]! + out.grad[i]! * b.data[i]!;
      if (b.requiresGrad) b.grad[i] = b.grad[i]! + out.grad[i]! * a.data[i]!;
    }
  });
}
export function scale(a: Tensor, k: number): Tensor {
  const out = zeros(a.rows, a.cols);
  for (let i = 0; i < out.data.length; i++) out.data[i] = a.data[i]! * k;
  return track(out, [a], () => {
    for (let i = 0; i < out.data.length; i++) a.grad[i] = a.grad[i]! + k * out.grad[i]!;
  });
}

type Activation = "relu" | "tanh" | "gelu" | "sigmoid" | "square";
function activation(a: Tensor, kind: Activation): Tensor {
  const out = zeros(a.rows, a.cols);
  const c = Math.sqrt(2 / Math.PI);
  for (let i = 0; i < out.data.length; i++) {
    const x = a.data[i]!;
    switch (kind) {
      case "relu": out.data[i] = Math.max(0, x); break;
      case "tanh": out.data[i] = Math.tanh(x); break;
      case "gelu": out.data[i] = 0.5 * x * (1 + Math.tanh(c * (x + 0.044715 * x * x * x))); break;
      case "sigmoid": out.data[i] = x >= 0 ? 1 / (1 + Math.exp(-x)) : Math.exp(x) / (1 + Math.exp(x)); break;
      case "square": out.data[i] = x * x; break;
    }
  }
  return track(out, [a], () => {
    for (let i = 0; i < out.data.length; i++) {
      const x = a.data[i]!;
      const y = out.data[i]!;
      let derivative: number;
      switch (kind) {
        case "relu": derivative = x > 0 ? 1 : 0; break;
        case "tanh": derivative = 1 - y * y; break;
        case "gelu": {
          const t = Math.tanh(c * (x + 0.044715 * x * x * x));
          derivative = 0.5 * (1 + t) + 0.5 * x * (1 - t * t) * c * (1 + 3 * 0.044715 * x * x);
          break;
        }
        case "sigmoid": derivative = y * (1 - y); break;
        case "square": derivative = 2 * x; break;
      }
      a.grad[i] = a.grad[i]! + derivative * out.grad[i]!;
    }
  });
}
export function relu(a: Tensor): Tensor { return activation(a, "relu"); }
export function tanh(a: Tensor): Tensor { return activation(a, "tanh"); }
export function gelu(a: Tensor): Tensor { return activation(a, "gelu"); }
export function sigmoid(a: Tensor): Tensor { return activation(a, "sigmoid"); }
export function square(a: Tensor): Tensor { return activation(a, "square"); }
export function sum(a: Tensor): Tensor {
  let total = 0;
  for (let i = 0; i < a.data.length; i++) total += a.data[i]!;
  const out = tensor([total], 1, 1);
  return track(out, [a], () => {
    for (let i = 0; i < a.data.length; i++) a.grad[i] = a.grad[i]! + out.grad[0]!;
  });
}
export function mean(a: Tensor): Tensor { return scale(sum(a), 1 / a.data.length); }
export function mse(a: Tensor, b: Tensor): Tensor { sameShape(a, b); return mean(square(sub(a, b))); }
export function transpose(a: Tensor): Tensor {
  const out = zeros(a.cols, a.rows);
  for (let i = 0; i < a.rows; i++) for (let j = 0; j < a.cols; j++) out.data[j * a.rows + i] = a.data[i * a.cols + j]!;
  return track(out, [a], () => {
    for (let i = 0; i < a.rows; i++) for (let j = 0; j < a.cols; j++) {
      const index = i * a.cols + j;
      a.grad[index] = a.grad[index]! + out.grad[j * a.rows + i]!;
    }
  });
}
export function rowSoftmax(a: Tensor): Tensor {
  const out = zeros(a.rows, a.cols);
  for (let r = 0; r < a.rows; r++) {
    const offset = r * a.cols;
    let max = -Infinity;
    for (let c = 0; c < a.cols; c++) max = Math.max(max, a.data[offset + c]!);
    let total = 0;
    for (let c = 0; c < a.cols; c++) { const e = Math.exp(a.data[offset + c]! - max); out.data[offset + c] = e; total += e; }
    for (let c = 0; c < a.cols; c++) out.data[offset + c] = out.data[offset + c]! / total;
  }
  return track(out, [a], () => {
    for (let r = 0; r < a.rows; r++) {
      const offset = r * a.cols;
      let dot = 0;
      for (let c = 0; c < a.cols; c++) dot += out.grad[offset + c]! * out.data[offset + c]!;
      for (let c = 0; c < a.cols; c++) {
        const i = offset + c;
        a.grad[i] = a.grad[i]! + out.data[i]! * (out.grad[i]! - dot);
      }
    }
  });
}

function norm(x: Tensor, gain: Tensor, bias: Tensor | null): Tensor {
  if (gain.rows !== 1 || gain.cols !== x.cols || (bias && (bias.rows !== 1 || bias.cols !== x.cols))) throw new Error("Normalization gain/bias must be [1, cols]");
  const out = zeros(x.rows, x.cols);
  const normalized = new Float32Array(x.data.length);
  const inverse = new Float32Array(x.rows);
  for (let r = 0; r < x.rows; r++) {
    const offset = r * x.cols;
    let center = 0;
    if (bias) {
      for (let c = 0; c < x.cols; c++) center += x.data[offset + c]!;
      center /= x.cols;
    }
    let variance = 0;
    for (let c = 0; c < x.cols; c++) { const v = x.data[offset + c]! - center; variance += v * v; }
    const inv = 1 / Math.sqrt(variance / x.cols + 1e-5);
    inverse[r] = inv;
    for (let c = 0; c < x.cols; c++) {
      const i = offset + c;
      const n = (x.data[i]! - center) * inv;
      normalized[i] = n;
      out.data[i] = n * gain.data[c]! + (bias ? bias.data[c]! : 0);
    }
  }
  return track(out, bias ? [x, gain, bias] : [x, gain], () => {
    for (let r = 0; r < x.rows; r++) {
      const offset = r * x.cols;
      let dgSum = 0;
      let dgDot = 0;
      for (let c = 0; c < x.cols; c++) {
        const i = offset + c;
        const g = out.grad[i]!;
        const dg = g * gain.data[c]!;
        dgSum += dg;
        dgDot += dg * normalized[i]!;
        if (gain.requiresGrad) gain.grad[c] = gain.grad[c]! + g * normalized[i]!;
        if (bias?.requiresGrad) bias.grad[c] = bias.grad[c]! + g;
      }
      if (x.requiresGrad) for (let c = 0; c < x.cols; c++) {
        const i = offset + c;
        x.grad[i] = x.grad[i]! + inverse[r]! * (out.grad[i]! * gain.data[c]! - (bias ? dgSum / x.cols : 0) - normalized[i]! * dgDot / x.cols);
      }
    }
  });
}
export function layerNorm(x: Tensor, gain: Tensor, bias: Tensor): Tensor { return norm(x, gain, bias); }
export function rmsNorm(x: Tensor, gain: Tensor): Tensor { return norm(x, gain, null); }

export function embedding(table: Tensor, ids: Int32Array): Tensor {
  const indices = ids.slice(); // Preserve the graph if the caller reuses its token buffer.
  const out = zeros(indices.length, table.cols);
  for (let r = 0; r < indices.length; r++) {
    const id = indices[r]!;
    if (id < 0 || id >= table.rows) throw new Error("Embedding ID is out of range");
    for (let c = 0; c < table.cols; c++) out.data[r * table.cols + c] = table.data[id * table.cols + c]!;
  }
  return track(out, [table], () => {
    for (let r = 0; r < indices.length; r++) for (let c = 0; c < table.cols; c++) {
      const i = indices[r]! * table.cols + c;
      table.grad[i] = table.grad[i]! + out.grad[r * table.cols + c]!;
    }
  });
}
export function concatCols(list: Tensor[]): Tensor {
  if (!list.length) throw new Error("concatCols needs at least one tensor");
  const parents = list.slice();
  const rows = parents[0]!.rows;
  let cols = 0;
  for (const x of parents) { if (x.rows !== rows) throw new Error("concatCols row counts must match"); cols += x.cols; }
  const out = zeros(rows, cols);
  let offset = 0;
  for (const x of parents) {
    for (let r = 0; r < rows; r++) for (let c = 0; c < x.cols; c++) out.data[r * cols + offset + c] = x.data[r * x.cols + c]!;
    offset += x.cols;
  }
  return track(out, parents, () => {
    let offset = 0;
    for (const x of parents) {
      if (x.requiresGrad) for (let r = 0; r < rows; r++) for (let c = 0; c < x.cols; c++) {
        const i = r * x.cols + c;
        x.grad[i] = x.grad[i]! + out.grad[r * cols + offset + c]!;
      }
      offset += x.cols;
    }
  });
}
export function sliceCols(x: Tensor, start: number, end: number): Tensor {
  if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end > x.cols || start >= end) throw new Error("Invalid column slice");
  const cols = end - start;
  const out = zeros(x.rows, cols);
  for (let r = 0; r < x.rows; r++) for (let c = 0; c < cols; c++) out.data[r * cols + c] = x.data[r * x.cols + start + c]!;
  return track(out, [x], () => {
    for (let r = 0; r < x.rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * x.cols + start + c;
      x.grad[i] = x.grad[i]! + out.grad[r * cols + c]!;
    }
  });
}
export function crossEntropy(logits: Tensor, targets: Int32Array): Tensor {
  if (targets.length !== logits.rows) throw new Error("One target is required per row");
  const probabilities = new Float32Array(logits.data.length);
  let loss = 0;
  for (let r = 0; r < logits.rows; r++) {
    const target = targets[r]!;
    if (target < 0 || target >= logits.cols) throw new Error("Target is out of range");
    const offset = r * logits.cols;
    let max = -Infinity;
    for (let c = 0; c < logits.cols; c++) max = Math.max(max, logits.data[offset + c]!);
    let total = 0;
    for (let c = 0; c < logits.cols; c++) { const e = Math.exp(logits.data[offset + c]! - max); probabilities[offset + c] = e; total += e; }
    loss += Math.log(total) + (max - logits.data[offset + target]!);
    for (let c = 0; c < logits.cols; c++) probabilities[offset + c] = (probabilities[offset + c]! / total - (c === target ? 1 : 0)) / logits.rows;
  }
  const out = tensor([loss / logits.rows], 1, 1);
  return track(out, [logits], () => {
    for (let i = 0; i < logits.data.length; i++) logits.grad[i] = logits.grad[i]! + out.grad[0]! * probabilities[i]!;
  });
}

/** Most recent attention probabilities, one row-major [T,T] buffer per head. */
export let lastAttention: Float32Array[] = [];
// For batches, call per sequence, then join rows with transpose(concatCols(outputs.map(transpose))).
export function causalSelfAttention(x: Tensor, wq: Tensor, wk: Tensor, wv: Tensor, wo: Tensor, nHeads: number, attnOut?: Float32Array[]): Tensor {
  const t = x.rows;
  const d = x.cols;
  if (!Number.isInteger(nHeads) || nHeads <= 0 || d % nHeads !== 0) throw new Error("Head count must divide model width");
  for (const w of [wq, wk, wv, wo]) if (w.rows !== d || w.cols !== d) throw new Error("Attention projections must be [d,d]");
  const dh = d / nHeads;
  const factor = 1 / Math.sqrt(dh);
  const q = new Float32Array(t * d);
  const k = new Float32Array(t * d);
  const v = new Float32Array(t * d);
  const context = new Float32Array(t * d);
  mm(x.data, wq.data, q, t, d, d);
  mm(x.data, wk.data, k, t, d, d);
  mm(x.data, wv.data, v, t, d, d);
  const weights: Float32Array[] = [];
  for (let h = 0; h < nHeads; h++) {
    const p = new Float32Array(t * t);
    weights.push(p);
    const head = h * dh;
    for (let i = 0; i < t; i++) {
      let max = -Infinity;
      for (let j = 0; j <= i; j++) {
        let dot = 0;
        for (let c = 0; c < dh; c++) dot += q[i * d + head + c]! * k[j * d + head + c]!;
        const score = dot * factor;
        p[i * t + j] = score;
        max = Math.max(max, score);
      }
      let total = 0;
      for (let j = 0; j <= i; j++) { const e = Math.exp(p[i * t + j]! - max); p[i * t + j] = e; total += e; }
      for (let j = 0; j <= i; j++) {
        const probability = p[i * t + j]! / total;
        p[i * t + j] = probability;
        for (let c = 0; c < dh; c++) {
          const index = i * d + head + c;
          context[index] = context[index]! + probability * v[j * d + head + c]!;
        }
      }
    }
  }
  lastAttention = weights;
  if (attnOut) { attnOut.length = 0; for (const p of weights) attnOut.push(p); }
  const out = zeros(t, d);
  mm(context, wo.data, out.data, t, d, d);
  return track(out, [x, wq, wk, wv, wo], () => {
    const needQ = x.requiresGrad || wq.requiresGrad;
    const needK = x.requiresGrad || wk.requiresGrad;
    const needV = x.requiresGrad || wv.requiresGrad;
    const gc = needQ || needK || needV ? new Float32Array(t * d) : null;
    mmBackward(context, wo.data, out.grad, gc, wo.requiresGrad ? wo.grad : null, t, d, d);
    if (!gc) return;
    const gq = needQ ? new Float32Array(t * d) : null;
    const gk = needK ? new Float32Array(t * d) : null;
    const gv = needV ? new Float32Array(t * d) : null;
    const dp = new Float64Array(t);
    for (let h = 0; h < nHeads; h++) {
      const p = weights[h]!;
      const head = h * dh;
      for (let i = 0; i < t; i++) {
        let weighted = 0;
        for (let j = 0; j <= i; j++) {
          let dot = 0;
          const probability = p[i * t + j]!;
          for (let c = 0; c < dh; c++) {
            const gi = gc[i * d + head + c]!;
            if (needQ || needK) dot += gi * v[j * d + head + c]!;
            if (gv) { const index = j * d + head + c; gv[index] = gv[index]! + probability * gi; }
          }
          dp[j] = dot;
          weighted += probability * dot;
        }
        if (needQ || needK) for (let j = 0; j <= i; j++) {
          const ds = p[i * t + j]! * (dp[j]! - weighted) * factor;
          for (let c = 0; c < dh; c++) {
            const qi = i * d + head + c;
            const ki = j * d + head + c;
            if (gq) gq[qi] = gq[qi]! + ds * k[ki]!;
            if (gk) gk[ki] = gk[ki]! + ds * q[qi]!;
          }
        }
      }
    }
    const gx = x.requiresGrad ? x.grad : null;
    if (gq) mmBackward(x.data, wq.data, gq, gx, wq.requiresGrad ? wq.grad : null, t, d, d);
    if (gk) mmBackward(x.data, wk.data, gk, gx, wk.requiresGrad ? wk.grad : null, t, d, d);
    if (gv) mmBackward(x.data, wv.data, gv, gx, wv.requiresGrad ? wv.grad : null, t, d, d);
  });
}

export class SGD {
  private readonly velocity: Float32Array[];
  constructor(private readonly params: Tensor[], public lr: number, private readonly momentum = 0) {
    this.velocity = momentum ? params.map(p => new Float32Array(p.data.length)) : [];
  }
  step(): void {
    for (let p = 0; p < this.params.length; p++) {
      const parameter = this.params[p]!;
      const velocity = this.velocity[p];
      for (let i = 0; i < parameter.data.length; i++) {
        let g = parameter.grad[i]!;
        if (velocity) { g += this.momentum * velocity[i]!; velocity[i] = g; }
        parameter.data[i] = parameter.data[i]! - this.lr * g;
      }
    }
  }
  zeroGrad(): void { for (const p of this.params) p.zeroGrad(); }
}
export interface AdamWOptions { beta1?: number; beta2?: number; eps?: number; weightDecay?: number }
export class AdamW {
  private readonly first: Float32Array[];
  private readonly second: Float32Array[];
  private readonly beta1: number;
  private readonly beta2: number;
  private readonly eps: number;
  private readonly weightDecay: number;
  private steps = 0;
  constructor(private readonly params: Tensor[], public lr: number, { beta1 = 0.9, beta2 = 0.999, eps = 1e-8, weightDecay = 0 }: AdamWOptions = {}) {
    this.beta1 = beta1;
    this.beta2 = beta2;
    this.eps = eps;
    this.weightDecay = weightDecay;
    this.first = params.map(p => new Float32Array(p.data.length));
    this.second = params.map(p => new Float32Array(p.data.length));
  }
  step(): void {
    this.steps++;
    const correction1 = 1 - this.beta1 ** this.steps;
    const correction2 = 1 - this.beta2 ** this.steps;
    const decay = 1 - this.lr * this.weightDecay;
    for (let p = 0; p < this.params.length; p++) {
      const parameter = this.params[p]!;
      const m = this.first[p]!;
      const v = this.second[p]!;
      for (let i = 0; i < parameter.data.length; i++) {
        const g = parameter.grad[i]!;
        const first = this.beta1 * m[i]! + (1 - this.beta1) * g;
        const second = this.beta2 * v[i]! + (1 - this.beta2) * g * g;
        m[i] = first;
        v[i] = second;
        parameter.data[i] = parameter.data[i]! * decay - this.lr * (first / correction1) / (Math.sqrt(second / correction2) + this.eps);
      }
    }
  }
  zeroGrad(): void { for (const p of this.params) p.zeroGrad(); }
}

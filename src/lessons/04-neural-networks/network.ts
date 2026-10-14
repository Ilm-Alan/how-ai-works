import { rng } from "../../lib/rng";
import { AdamW, Tensor, add, crossEntropy, matmul, randn, relu, tanh, tensor, zeros } from "../../lib/tensor";

export type Dataset = "xor" | "circles" | "spiral";
export type Activation = "linear" | "relu" | "tanh";
export interface Samples { x: Tensor; y: Int32Array }

export function samples(kind: Dataset, n = 96): Samples {
  const r = rng(17);
  const data = new Float32Array(n * 2);
  const y = new Int32Array(n);
  for (let i = 0; i < n; i++) {
    const label = i % 2;
    let x: number, z: number;
    if (kind === "xor") {
      x = (r.next() < 0.5 ? -0.65 : 0.65) + 0.16 * r.normal();
      z = (r.next() < 0.5 ? -0.65 : 0.65) + 0.16 * r.normal();
      y[i] = Number(x * z > 0);
    } else if (kind === "circles") {
      const angle = r.next() * Math.PI * 2;
      const radius = (label ? 0.8 : 0.3) + 0.04 * r.normal();
      x = radius * Math.cos(angle); z = radius * Math.sin(angle); y[i] = label;
    } else {
      const radius = 0.08 + 0.84 * (i / n);
      const angle = radius * 5 + label * Math.PI + 0.12 * r.normal();
      x = radius * Math.cos(angle); z = radius * Math.sin(angle); y[i] = label;
    }
    data[i * 2] = x; data[i * 2 + 1] = z;
  }
  return { x: tensor(data, n, 2), y };
}

export class MLP {
  readonly layers: { w: Tensor; b: Tensor }[] = [];
  readonly optimizer: AdamW;
  constructor(readonly width: number, readonly depth: number, readonly activation: Activation) {
    const r = rng(23);
    for (let l = 0; l <= depth; l++) {
      const fanIn = l === 0 ? 2 : width;
      const fanOut = l === depth ? 2 : width;
      this.layers.push({ w: randn(fanIn, fanOut, Math.sqrt((activation === "relu" ? 2 : 1) / fanIn), r), b: zeros(1, fanOut, true) });
    }
    this.optimizer = new AdamW(this.layers.flatMap(l => [l.w, l.b]), 0.015);
  }
  forward(x: Tensor): Tensor {
    let h = x;
    for (let i = 0; i < this.layers.length; i++) {
      const l = this.layers[i]!;
      h = add(matmul(h, l.w), l.b);
      if (i < this.depth) h = this.activation === "relu" ? relu(h) : this.activation === "tanh" ? tanh(h) : h;
    }
    return h;
  }
  train(data: Samples): number {
    this.optimizer.zeroGrad();
    const loss = crossEntropy(this.forward(data.x), data.y);
    loss.backward();
    this.optimizer.step();
    return loss.data[0]!;
  }
  // Inference uses the same weights without constructing an autograd graph for the field.
  probabilities(points: Float32Array): Float32Array {
    const n = points.length / 2;
    let current = points;
    for (let l = 0; l < this.layers.length; l++) {
      const { w, b } = this.layers[l]!;
      const out = new Float32Array(n * w.cols);
      for (let r = 0; r < n; r++) for (let j = 0; j < w.cols; j++) {
        let v = b.data[j]!;
        for (let k = 0; k < w.rows; k++) v += current[r * w.rows + k]! * w.data[k * w.cols + j]!;
        out[r * w.cols + j] = l === this.depth || this.activation === "linear" ? v : this.activation === "relu" ? Math.max(0, v) : Math.tanh(v);
      }
      current = out;
    }
    const p = new Float32Array(n);
    for (let i = 0; i < n; i++) p[i] = 1 / (1 + Math.exp(current[2 * i]! - current[2 * i + 1]!));
    return p;
  }
}

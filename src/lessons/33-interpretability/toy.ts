import { rng } from "../../lib/rng";
import { AdamW, add, matmul, mean, mul, param, randn, relu, square, sub, tensor, transpose } from "../../lib/tensor";

/** Tied-weight ReLU reconstruction model, W stored as [2, n]. */
export class ToyModel {
  readonly random;
  readonly w;
  readonly b;
  readonly optimizer;
  readonly weights;
  steps = 0;
  loss = 0;
  constructor(public n = 5, public sparsity = 0.95, public decay = 0.7, seed = 1, public batchSize = 128) {
    this.random = rng(seed);
    this.w = randn(2, n, 0.3, this.random);
    this.b = param(new Float32Array(n), 1, n);
    this.optimizer = new AdamW([this.w, this.b], 0.02);
    this.weights = tensor(Array.from({ length: batchSize * n }, (_, i) => decay ** (i % n)), batchSize, n);
  }
  step(): number {
    const x = tensor(Array.from({ length: this.batchSize * this.n }, () => this.random.next() < this.sparsity ? 0 : this.random.next()), this.batchSize, this.n);
    this.optimizer.zeroGrad();
    const h = matmul(x, transpose(this.w));
    const reconstructed = relu(add(matmul(h, this.w), this.b));
    const loss = mean(mul(square(sub(reconstructed, x)), this.weights));
    loss.backward();
    this.optimizer.lr = 0.02 * Math.max(0.1, 1 - this.steps / 6000);
    this.optimizer.step();
    this.steps++;
    this.loss = loss.data[0]!;
    return this.loss;
  }
  metrics() {
    const norms = Array.from({ length: this.n }, (_, i) => Math.hypot(this.w.data[i]!, this.w.data[this.n + i]!));
    const interference = norms.map((norm, i) => {
      let total = 0;
      if (norm < 1e-8) return total;
      for (let j = 0; j < this.n; j++) if (j !== i) {
        total += ((this.w.data[i]! * this.w.data[j]! + this.w.data[this.n + i]! * this.w.data[this.n + j]!) / norm) ** 2;
      }
      return total;
    });
    return { norms, interference, represented: norms.filter(v => v > 0.8).length };
  }
}

import { rng } from "../../lib/rng";
import { matmul, mse, param, SGD, tensor, type Tensor } from "../../lib/tensor";
export type Schedule = "constant" | "cosine" | "wsd";
export const STEPS = 400, WARMUP = 20, DECAY_START = 320, DECAY_LENGTH = 80, DEFAULT_LR = 0.12;
export function learningRate(kind: Schedule, step: number, peak: number, decayStart = DECAY_START, decayLength = DECAY_LENGTH): number {
  if (step < WARMUP) return peak * (step + 1) / WARMUP;
  if (kind === "constant") return peak;
  const t = kind === "cosine" ? (step - WARMUP) / (STEPS - 1 - WARMUP) : (step - decayStart) / (decayLength - 1);
  return peak * (kind === "cosine" ? (1 + Math.cos(Math.PI * Math.max(0, Math.min(1, t)))) / 2 : 1 - Math.max(0, Math.min(1, t)));
}
const truth = (x: number) => 0.3 + 0.7 * x - 0.2 * x * x;
const grid = Array.from({ length: 101 }, (_, i) => -2 + i / 25);
const evaluationX = tensor(grid.flatMap(x => [1, x, x * x]), grid.length, 3);
const evaluationY = tensor(grid.map(truth), grid.length, 1);
export interface Point { step: number; loss: number; lr: number }
/** Three trainable coefficients; noisy minibatches, noise-free fixed evaluation grid. */
export class Run {
  readonly weights: Tensor;
  readonly optimizer: SGD;
  readonly history: Point[];
  step = 0;
  diverged = false;
  constructor(public kind: Schedule, public peak = DEFAULT_LR, public decayStart = DECAY_START, public decayLength = DECAY_LENGTH, weights?: ArrayLike<number>) {
    this.weights = param(weights ?? [0, 0, 0], 3, 1);
    this.optimizer = new SGD([this.weights], peak);
    this.history = [{ step: 0, loss: this.loss(), lr: learningRate(kind, 0, peak, decayStart, decayLength) }];
  }
  loss(): number { return mse(matmul(evaluationX, this.weights), evaluationY).data[0]!; }
  tick(): boolean {
    const end = this.kind === "wsd" ? this.decayStart + this.decayLength : STEPS;
    if (this.diverged || this.step >= end) return false;
    // Step-indexed RNG means schedule comparisons and branches consume identical batches.
    const r = rng(1000 + this.step);
    const inputs: number[] = [], labels: number[] = [];
    for (let i = 0; i < 8; i++) {
      const x = r.next() * 4 - 2;
      inputs.push(1, x, x * x); labels.push(truth(x) + 0.5 * r.normal());
    }
    this.optimizer.zeroGrad();
    mse(matmul(tensor(inputs, 8, 3), this.weights), tensor(labels, 8, 1)).backward();
    const lr = learningRate(this.kind, this.step, this.peak, this.decayStart, this.decayLength);
    this.optimizer.lr = lr; this.optimizer.step(); this.step++;
    const loss = this.loss();
    this.diverged = !Number.isFinite(loss) || loss > 1e8;
    this.history.push({ step: this.step, loss, lr });
    return !this.diverged && this.step < end;
  }
  branch(): Run {
    const start = Math.max(WARMUP, this.step);
    const branch = new Run("wsd", this.peak, start, DECAY_LENGTH, this.weights.data);
    branch.step = this.step;
    branch.history.splice(0, 1, ...this.history.map(p => ({ ...p })));
    return branch;
  }
}

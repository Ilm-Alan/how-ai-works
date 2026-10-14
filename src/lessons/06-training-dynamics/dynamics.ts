import { rng } from "../../lib/rng";
import { SGD, Tensor, add, matmul, mse, param, randn, rmsNorm, scale, tanh, tensor, zeros } from "../../lib/tensor";

export interface Settings { residual: boolean; norm: boolean; initScale: number }
export const defaults: Settings = { residual: true, norm: true, initScale: 0.7 };
export const DEPTH = 20;
const WIDTH = 8;
export class DeepExperiment {
  readonly layers: { w: Tensor; b: Tensor; gain: Tensor }[] = [];
  readonly output: Tensor;
  readonly bias = zeros(1, 1, true);
  readonly x: Tensor;
  readonly target: Tensor;
  readonly optimizer: SGD;
  constructor(readonly settings: Settings) {
    const dataRng = rng(7), r = rng(41);
    const data = new Float32Array(16 * WIDTH), targets = new Float32Array(16);
    for (let i = 0; i < data.length; i++) data[i] = 0.6 * dataRng.normal();
    for (let i = 0; i < targets.length; i++) targets[i] = 0.8 * data[i * WIDTH]! - 0.5 * data[i * WIDTH + 1]! + 0.3 * data[i * WIDTH + 2]!;
    this.x = tensor(data, 16, WIDTH); this.target = tensor(targets, 16, 1);
    for (let i = 0; i < DEPTH; i++) this.layers.push({
      w: randn(WIDTH, WIDTH, settings.initScale / Math.sqrt(WIDTH), r),
      b: zeros(1, WIDTH, true), gain: param(new Float32Array(WIDTH).fill(1), 1, WIDTH),
    });
    this.output = randn(WIDTH, 1, 1 / Math.sqrt(WIDTH), r);
    this.optimizer = new SGD([...this.layers.flatMap(l => settings.norm ? [l.w, l.b, l.gain] : [l.w, l.b]), this.output, this.bias], 0.03);
  }
  measure(update = false): { loss: number; norms: number[] } {
    this.optimizer.zeroGrad();
    const hidden: Tensor[] = [];
    let h = this.x;
    for (const layer of this.layers) {
      const input = this.settings.norm ? rmsNorm(h, layer.gain) : h;
      const branch = tanh(add(matmul(input, layer.w), layer.b));
      h = this.settings.residual ? add(h, scale(branch, 1 / Math.sqrt(DEPTH))) : branch;
      hidden.push(h);
    }
    const loss = mse(add(matmul(h, this.output), this.bias), this.target);
    loss.backward();
    const norms = hidden.map(h => {
      let squared = 0;
      for (const g of h.grad) squared += g * g;
      return Math.sqrt(squared);
    });
    if (update && Number.isFinite(loss.data[0]) && norms.every(Number.isFinite)) this.optimizer.step();
    return { loss: loss.data[0]!, norms };
  }
}

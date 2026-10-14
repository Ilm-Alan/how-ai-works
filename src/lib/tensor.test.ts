import { describe, expect, test } from "bun:test";
import { rng } from "./rng";
import {
  AdamW, SGD, Tensor, add, causalSelfAttention, concatCols, crossEntropy,
  embedding, gelu, lastAttention, layerNorm, matmul, mean, mse, mul, param,
  randn, relu, rmsNorm, rowSoftmax, scale, sigmoid, sliceCols, square, sub,
  sum, tanh, tensor, transpose, zeros,
} from "./tensor";

/** Float32 forward differences; the reduction is evaluated in float64. */
function gradientCheck(inputs: Tensor[], forward: () => Tensor): void {
  for (const x of inputs) x.zeroGrad();
  const output = forward();
  const coefficients = new Float32Array(output.data.length);
  for (let i = 0; i < coefficients.length; i++) coefficients[i] = 0.3 + Math.sin(i * 1.7 + 0.4);
  const weights = new Tensor(coefficients, output.rows, output.cols);
  sum(mul(output, weights)).backward();
  const analytic = inputs.map(x => x.grad.slice());
  const evaluate = (): number => {
    const value = forward();
    let result = 0;
    for (let i = 0; i < value.data.length; i++) result += value.data[i]! * coefficients[i]!;
    return result;
  };
  for (let p = 0; p < inputs.length; p++) {
    const x = inputs[p]!;
    for (let i = 0; i < x.data.length; i++) {
      const original = x.data[i]!;
      x.data[i] = original + 0.003;
      const high = x.data[i]!;
      const plus = evaluate();
      x.data[i] = original - 0.003;
      const low = x.data[i]!;
      const minus = evaluate();
      x.data[i] = original;
      const numerical = (plus - minus) / (high - low);
      const actual = analytic[p]![i]!;
      expect(Number.isFinite(actual)).toBe(true);
      expect(Math.abs(actual - numerical)).toBeLessThanOrEqual(0.0003 + 0.01 * Math.max(Math.abs(actual), Math.abs(numerical)));
    }
  }
}

function attentionReference(x: Tensor, projections: Tensor[], heads: number): Float64Array {
  const t = x.rows;
  const d = x.cols;
  const dh = d / heads;
  const projected = projections.slice(0, 3).map(w => {
    const result = new Float64Array(t * d);
    for (let i = 0; i < t; i++) for (let j = 0; j < d; j++) {
      let total = 0;
      for (let k = 0; k < d; k++) total += x.data[i * d + k]! * w.data[k * d + j]!;
      result[i * d + j] = total;
    }
    return result;
  });
  const [q, k, v] = projected as [Float64Array, Float64Array, Float64Array];
  const context = new Float64Array(t * d);
  for (let h = 0; h < heads; h++) for (let i = 0; i < t; i++) {
    const scores = new Float64Array(i + 1);
    for (let j = 0; j <= i; j++) {
      let dot = 0;
      for (let c = 0; c < dh; c++) dot += q[i * d + h * dh + c]! * k[j * d + h * dh + c]!;
      scores[j] = dot / Math.sqrt(dh);
    }
    const max = Math.max(...scores);
    let total = 0;
    for (let j = 0; j <= i; j++) { scores[j] = Math.exp(scores[j]! - max); total += scores[j]!; }
    for (let c = 0; c < dh; c++) {
      let result = 0;
      for (let j = 0; j <= i; j++) result += scores[j]! / total * v[j * d + h * dh + c]!;
      context[i * d + h * dh + c] = result;
    }
  }
  const result = new Float64Array(t * d);
  const wo = projections[3]!;
  for (let i = 0; i < t; i++) for (let j = 0; j < d; j++) {
    let total = 0;
    for (let c = 0; c < d; c++) total += context[i * d + c]! * wo.data[c * d + j]!;
    result[i * d + j] = total;
  }
  return result;
}

describe("seeded random numbers", () => {
  test("reproducibility, bounds, normal distribution and in-place shuffle", () => {
    const a = rng(42);
    const b = rng(42);
    let total = 0;
    let squares = 0;
    for (let i = 0; i < 10000; i++) {
      const uniform = a.next();
      expect(uniform).toBe(b.next());
      expect(uniform).toBeGreaterThanOrEqual(0);
      expect(uniform).toBeLessThan(1);
      const normal = a.normal();
      expect(normal).toBe(b.normal());
      total += normal;
      squares += normal * normal;
      const integer = a.int(7);
      expect(integer).toBe(b.int(7));
      expect(integer).toBeGreaterThanOrEqual(0);
      expect(integer).toBeLessThan(7);
    }
    expect(Math.abs(total / 10000)).toBeLessThan(0.04);
    expect(Math.abs(squares / 10000 - 1)).toBeLessThan(0.05);
    const values = [0, 1, 2, 3, 4];
    expect(a.shuffle(values)).toBe(values);
    expect([...values].sort()).toEqual([0, 1, 2, 3, 4]);
    expect(() => a.int(0)).toThrow();
  });
});

describe("finite-difference gradients", () => {
  test("matmul", () => {
    const r = rng(1);
    const a = randn(3, 4, 0.4, r);
    const b = randn(4, 2, 0.4, r);
    gradientCheck([a, b], () => matmul(a, b));
  });
  test("row-broadcast add and subtraction", () => {
    const r = rng(2);
    const a = randn(3, 4, 0.4, r);
    const b = randn(1, 4, 0.4, r);
    gradientCheck([a, b], () => add(a, b));
    gradientCheck([a, b], () => sub(a, b));
  });
  for (const [name, operation] of [["relu", relu], ["tanh", tanh], ["gelu", gelu], ["sigmoid", sigmoid], ["square", square]] as const) {
    test(name, () => {
      const a = param([-1.7, -0.8, -0.2, 0.1, 0.7, 1.4], 2, 3);
      gradientCheck([a], () => operation(a));
    });
  }
  test("rowSoftmax and shift invariance", () => {
    const a = param([0.3, -0.4, 1.2, 0.7, 0.1, -0.9], 2, 3);
    gradientCheck([a], () => rowSoftmax(a));
    const original = rowSoftmax(a);
    const shifted = rowSoftmax(add(a, tensor([100, 100, 100], 1, 3)));
    for (let i = 0; i < original.data.length; i++) expect(Math.abs(original.data[i]! - shifted.data[i]!)).toBeLessThan(2e-6);
  });
  test("layerNorm including gain and bias", () => {
    const r = rng(3);
    const x = randn(3, 4, 0.7, r);
    const gain = param([0.8, 1.3, 0.7, 1.1], 1, 4);
    const bias = randn(1, 4, 0.2, r);
    gradientCheck([x, gain, bias], () => layerNorm(x, gain, bias));
  });
  test("rmsNorm including gain", () => {
    const r = rng(4);
    const x = randn(3, 4, 0.7, r);
    const gain = param([0.8, 1.3, 0.7, 1.1], 1, 4);
    gradientCheck([x, gain], () => rmsNorm(x, gain));
  });
  test("normalization is finite on constant rows", () => {
    const x = param([0, 0, 0, 2, 2, 2], 2, 3);
    const gain = param([1, 1, 1], 1, 3);
    const bias = zeros(1, 3, true);
    expect(Array.from(layerNorm(x, gain, bias).data)).toEqual([0, 0, 0, 0, 0, 0]);
    sum(add(layerNorm(x, gain, bias), rmsNorm(x, gain))).backward();
    for (const p of [x, gain, bias]) for (const g of p.grad) expect(Number.isFinite(g)).toBe(true);
  });
  test("embedding with repeated IDs", () => {
    const table = randn(5, 3, 0.4, rng(5));
    gradientCheck([table], () => embedding(table, new Int32Array([3, 1, 3])));
  });
  test("crossEntropy", () => {
    const logits = randn(3, 5, 0.8, rng(6));
    gradientCheck([logits], () => crossEntropy(logits, new Int32Array([0, 4, 1])));
    const extreme = param([1000, -1000, -1000, 1000], 2, 2);
    const loss = crossEntropy(extreme, new Int32Array([1, 0]));
    expect(loss.data[0]).toBe(2000);
    loss.backward();
    expect(Array.from(extreme.grad)).toEqual([0.5, -0.5, -0.5, 0.5]);
  });
  test("transpose, slices, concatenation, multiplication and mean", () => {
    const x = randn(2, 5, 0.5, rng(7));
    gradientCheck([x], () => transpose(concatCols([sliceCols(x, 2, 5), sliceCols(x, 0, 3)])));
    gradientCheck([x], () => mean(mul(x, x)));
    gradientCheck([x], () => mse(x, tensor([1, 2, 0, -1, 0, 1, 2, 0, -1, 0], 2, 5)));
  });
  test("causalSelfAttention, T=4, d=8, two heads", () => {
    const r = rng(8);
    const x = randn(4, 8, 0.6, r);
    const wq = randn(8, 8, 0.3, r);
    const wk = randn(8, 8, 0.3, r);
    const wv = randn(8, 8, 0.3, r);
    const wo = randn(8, 8, 0.3, r);
    const projections = [wq, wk, wv, wo];
    const visualization: Float32Array[] = [];
    const output = causalSelfAttention(x, wq, wk, wv, wo, 2, visualization);
    const reference = attentionReference(x, projections, 2);
    for (let i = 0; i < output.data.length; i++) expect(Math.abs(output.data[i]! - reference[i]!)).toBeLessThan(1e-6);
    expect(visualization.length).toBe(2);
    expect(lastAttention).toEqual(visualization);
    for (const head of visualization) for (let i = 0; i < 4; i++) {
      let total = 0;
      for (let j = 0; j < 4; j++) {
        total += head[i * 4 + j]!;
        if (j > i) expect(head[i * 4 + j]).toBe(0);
      }
      expect(Math.abs(total - 1)).toBeLessThan(1e-6);
    }
    gradientCheck([x, ...projections], () => causalSelfAttention(x, wq, wk, wv, wo, 2));
    // Future tokens cannot affect earlier outputs.
    const saved = x.data.slice(3 * 8);
    x.data.fill(10, 3 * 8);
    const changed = causalSelfAttention(x, wq, wk, wv, wo, 2);
    for (let i = 0; i < 3 * 8; i++) expect(changed.data[i]).toBe(output.data[i]);
    x.data.set(saved, 3 * 8);
  });
  test("attention gradients when projections share a parameter", () => {
    const r = rng(9);
    const x = randn(3, 4, 0.5, r);
    const w = randn(4, 4, 0.3, r);
    gradientCheck([x, w], () => causalSelfAttention(x, w, w, w, w, 2));
  });
});

describe("graph and optimizers", () => {
  test("shared intermediates and repeated backward accumulate leaf gradients", () => {
    const x = param([0.5, -1, 2], 1, 3);
    const u = square(x);
    const v = add(u, x);
    const loss = sum(add(v, u));
    loss.backward();
    expect(Array.from(x.grad)).toEqual([3, -3, 9]);
    loss.backward();
    expect(Array.from(x.grad)).toEqual([6, -6, 18]);
    x.zeroGrad();
    loss.backward();
    expect(Array.from(x.grad)).toEqual([3, -3, 9]);
  });
  test("non-scalar backward rejects; constant graphs do not accumulate", () => {
    expect(() => zeros(2, 2).backward()).toThrow();
    const constant = tensor([2], 1, 1);
    square(constant).backward();
    expect(constant.grad[0]).toBe(0);
    expect(() => matmul(zeros(2, 3), zeros(2, 3))).toThrow();
    expect(() => causalSelfAttention(zeros(2, 3), zeros(3, 3), zeros(3, 3), zeros(3, 3), zeros(3, 3), 2)).toThrow();
  });
  test("SGD momentum and gradient reset", () => {
    const p = param([1, 2], 1, 2);
    const optimizer = new SGD([p], 0.1, 0.5);
    p.grad.set([2, -3]);
    optimizer.step();
    expect(p.data[0]).toBeCloseTo(0.8, 6);
    expect(p.data[1]).toBeCloseTo(2.3, 6);
    optimizer.step();
    expect(p.data[0]).toBeCloseTo(0.5, 6);
    expect(p.data[1]).toBeCloseTo(2.75, 6);
    optimizer.zeroGrad();
    expect(Array.from(p.grad)).toEqual([0, 0]);
  });
  test("AdamW bias correction, decoupled decay and mutable learning rate", () => {
    const p = param([2], 1, 1);
    const optimizer = new AdamW([p], 0.1, { weightDecay: 0.2 });
    p.grad[0] = 3;
    optimizer.step();
    expect(p.data[0]).toBeCloseTo(1.86, 6);
    optimizer.lr = 0.05;
    optimizer.step();
    expect(p.data[0]).toBeCloseTo(1.7914, 6);
    optimizer.zeroGrad();
    expect(p.grad[0]).toBe(0);
  });
});

test("2-16-2 MLP learns XOR to >95% accuracy within 500 AdamW steps", () => {
  const r = rng(2026);
  const x = tensor([-1, -1, -1, 1, 1, -1, 1, 1], 4, 2);
  const targets = new Int32Array([0, 1, 1, 0]);
  const w1 = randn(2, 16, Math.sqrt(1 / 2), r);
  const b1 = zeros(1, 16, true);
  const w2 = randn(16, 2, Math.sqrt(1 / 16), r);
  const b2 = zeros(1, 2, true);
  const optimizer = new AdamW([w1, b1, w2, b2], 0.03);
  const forward = (): Tensor => add(matmul(tanh(add(matmul(x, w1), b1)), w2), b2);
  for (let step = 0; step < 500; step++) {
    optimizer.zeroGrad();
    crossEntropy(forward(), targets).backward();
    optimizer.step();
  }
  const logits = forward();
  let correct = 0;
  for (let i = 0; i < 4; i++) if ((logits.data[i * 2]! > logits.data[i * 2 + 1]! ? 0 : 1) === targets[i]) correct++;
  expect(correct / 4).toBeGreaterThan(0.95);
  expect(crossEntropy(logits, targets).data[0]!).toBeLessThan(0.02);
});

test("one-layer transformer forward/backward step stays under 30ms", () => {
  const r = rng(10);
  const t = 32;
  const d = 48;
  const vocab = 60;
  const table = randn(vocab, d, 0.1, r);
  const position = randn(t, d, 0.1, r);
  const wq = randn(d, d, 1 / Math.sqrt(d), r);
  const wk = randn(d, d, 1 / Math.sqrt(d), r);
  const wv = randn(d, d, 1 / Math.sqrt(d), r);
  const wo = randn(d, d, 1 / Math.sqrt(d), r);
  const w1 = randn(d, d * 4, 1 / Math.sqrt(d), r);
  const w2 = randn(d * 4, d, 1 / Math.sqrt(d * 4), r);
  const head = randn(d, vocab, 1 / Math.sqrt(d), r);
  const g1 = tensor(new Float32Array(d).fill(1), 1, d, true);
  const g2 = tensor(new Float32Array(d).fill(1), 1, d, true);
  const b1 = zeros(1, d, true);
  const b2 = zeros(1, d, true);
  const ids = Int32Array.from({ length: t }, () => r.int(vocab));
  const targets = Int32Array.from({ length: t }, () => r.int(vocab));
  const params = [table, position, wq, wk, wv, wo, w1, w2, head, g1, g2, b1, b2];
  const optimizer = new AdamW(params, 0.001);
  const step = (): void => {
    optimizer.zeroGrad();
    const x = add(embedding(table, ids), position);
    const attention = causalSelfAttention(layerNorm(x, g1, b1), wq, wk, wv, wo, 4);
    const residual = add(x, attention);
    const hidden = layerNorm(residual, g2, b2);
    const mlp = matmul(gelu(matmul(hidden, w1)), w2);
    const logits = matmul(add(residual, mlp), head);
    const loss = crossEntropy(logits, targets);
    loss.backward();
    optimizer.step();
    expect(Number.isFinite(loss.data[0]!)).toBe(true);
  };
  // Warm the JIT before measuring steady-state browser-lab-sized work.
  for (let i = 0; i < 6; i++) step();
  const elapsed: number[] = [];
  for (let i = 0; i < 7; i++) { const start = performance.now(); step(); elapsed.push(performance.now() - start); }
  elapsed.sort((a, b) => a - b);
  expect(elapsed[3]!).toBeLessThan(30);
});

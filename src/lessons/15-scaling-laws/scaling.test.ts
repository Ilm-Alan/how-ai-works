import { expect, test } from "bun:test";
import { allocation, FIT, loss, optimal } from "./scaling";

test("analytic optimum conserves compute and minimizes each isoFLOP curve", () => {
  for (const compute of [1e20, 1e21, 1e22, 1e23, 1e24]) {
    const o = optimal(compute);
    expect((6 * o.parameters * o.tokens) / compute).toBeCloseTo(1, 12);
    const l = loss(o.parameters, o.tokens);
    for (const factor of [0.25, 0.5, 0.99, 1.01, 2, 4]) expect(allocation(compute, factor).loss).toBeGreaterThan(l);
    // At the optimum the marginal returns of parameters and data balance.
    expect((FIT.alpha * FIT.A) / o.parameters ** FIT.alpha).toBeCloseTo((FIT.beta * FIT.B) / o.tokens ** FIT.beta, 10);
  }
});

test("the replicated fit gives roughly 20 tokens per parameter across typical budgets", () => {
  for (const compute of [1e21, 1e22, 5.76e23, 1e24]) {
    const o = optimal(compute);
    const ratio = o.tokens / o.parameters;
    expect(ratio).toBeGreaterThan(15);
    expect(ratio).toBeLessThan(30);
  }
});

test("halving size at fixed budget doubles tokens and halves dense inference work", () => {
  const a = allocation(1e22, 1);
  const b = allocation(1e22, 0.5);
  expect(b.tokens / a.tokens).toBe(2);
  expect(b.inferenceFlops / a.inferenceFlops).toBe(0.5);
  expect(b.loss).toBeGreaterThan(a.loss);
});

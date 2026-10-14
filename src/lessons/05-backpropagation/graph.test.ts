import { expect, test } from "bun:test";
import { backwardNode, defaults, evaluate, finiteDifferences, gradients, nodes } from "./graph";

test("forward computes the stated neuron loss", () => {
  const v = evaluate(defaults);
  expect(v[8]).toBeCloseTo(0.86, 12);
  expect(v[11]).toBeCloseTo(0.5 * (Math.tanh(0.86) - 0.2) ** 2, 12);
});

test("every node gradient matches a centered finite difference", () => {
  for (const inputs of [defaults, { x1: -0.3, x2: 1.1, w1: -0.6, w2: 0.2, b: -0.4, target: 0.7 }]) {
    const exact = gradients(inputs), approximate = finiteDifferences(inputs);
    for (let i = 0; i < nodes.length; i++) expect(exact[i]).toBeCloseTo(approximate[i]!, 7);
  }
});

test("backward accumulates into an existing parent gradient", () => {
  const grads = nodes.map(() => 0);
  grads[0] = 2; grads[6] = 3;
  backwardNode(6, evaluate(defaults), grads);
  expect(grads[0]).toBeCloseTo(2 + 3 * defaults.w1, 12);
  expect(grads[2]).toBeCloseTo(3 * defaults.x1, 12);
});

test("zero residual gives zero sensitivities except loss itself", () => {
  const inputs = { ...defaults, target: Math.tanh(0.86) };
  const g = gradients(inputs);
  expect(g[11]).toBe(1);
  for (const v of g.slice(0, 11)) expect(Math.abs(v)).toBeLessThan(1e-14);
});

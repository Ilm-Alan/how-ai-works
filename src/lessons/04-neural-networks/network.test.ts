import { expect, test } from "bun:test";
import { crossEntropy, rowSoftmax } from "../../lib/tensor";
import { MLP, samples } from "./network";

test("seeded datasets and reset are reproducible", () => {
  for (const kind of ["xor", "circles", "spiral"] as const) {
    expect(samples(kind).x.data).toEqual(samples(kind).x.data);
    expect(new MLP(8, 2, "tanh").probabilities(samples(kind).x.data)).toEqual(new MLP(8, 2, "tanh").probabilities(samples(kind).x.data));
  }
});

test("field inference matches tensor forward for every activation", () => {
  const data = samples("circles", 12);
  for (const activation of ["linear", "relu", "tanh"] as const) {
    const model = new MLP(6, 3, activation);
    const expected = rowSoftmax(model.forward(data.x)).data;
    const actual = model.probabilities(data.x.data);
    for (let i = 0; i < actual.length; i++) expect(actual[i]).toBeCloseTo(expected[i * 2 + 1]!, 5);
  }
});

test("nonlinear MLP learns XOR while a linear stack cannot separate it", () => {
  const data = samples("xor");
  const nonlinear = new MLP(12, 2, "tanh"), linear = new MLP(12, 2, "linear");
  for (let i = 0; i < 220; i++) { nonlinear.train(data); linear.train(data); }
  expect(crossEntropy(nonlinear.forward(data.x), data.y).data[0]).toBeLessThan(0.05);
  expect(crossEntropy(linear.forward(data.x), data.y).data[0]).toBeGreaterThan(0.5);
});

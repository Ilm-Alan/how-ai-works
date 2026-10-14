import { describe, expect, test } from "bun:test";
import { rng } from "../../lib/rng";
import { corpus, TinyLM, sampleToken } from "./model";

describe("character transformer", () => {
  test("near-uniform initialization learns a repeated string", () => {
    const config = { layers: 1, width: 16, context: 8, lr: 0.005, batch: 4 };
    const data = corpus("to be or not to be.\n".repeat(80), config.context);
    const model = new TinyLM(data.chars.length, config);
    const initial = model.evaluate(data.train);
    expect(Math.abs(initial - Math.log(data.chars.length))).toBeLessThan(0.1);
    for (let i = 0; i < 400; i++) model.train(data.train);
    expect(model.evaluate(data.train)).toBeLessThan(initial * 0.45);
    expect(model.evaluate(data.validation)).toBeLessThan(initial * 0.45);
  });
  test("zero and nearly zero temperatures select argmax, including huge logits", () => {
    for (const temperature of [0, 1e-12, 1e-6, 1e-5]) {
      for (let seed = 0; seed < 20; seed++) expect(sampleToken([-1000, 5, 1000, 999], temperature, rng(seed))).toBe(2);
    }
    expect(sampleToken([2, 2, 1], 0, rng(1))).toBe(0);
  });
  test("two layers have normalized causal attention and no future leakage", () => {
    const model = new TinyLM(4, { layers: 2, width: 8, context: 4, lr: 0.003, batch: 2 });
    model.inference(() => {
      const maps: Float32Array[][] = [];
      const first = model.forward(Int32Array.of(0, 1, 2, 3), maps).data;
      const changed = model.forward(Int32Array.of(0, 1, 3, 2)).data;
      expect(Array.from(first.subarray(0, 8))).toEqual(Array.from(changed.subarray(0, 8)));
      expect(maps.length).toBe(2);
      for (const heads of maps) for (const weights of heads) for (let i = 0; i < 4; i++) {
        let sum = 0;
        for (let j = 0; j < 4; j++) { sum += weights[i * 4 + j]!; if (j > i) expect(weights[i * 4 + j]).toBe(0); }
        expect(sum).toBeCloseTo(1, 5);
      }
    });
  });
  test("evaluation and generation leave the seeded training path unchanged", () => {
    const config = { layers: 1, width: 8, context: 8, lr: 0.003, batch: 3 };
    const data = corpus("a little repeated text.\n".repeat(40), 8);
    const a = new TinyLM(data.chars.length, config), b = new TinyLM(data.chars.length, config);
    a.evaluate(data.validation); a.generate("a ", data, 5);
    expect(a.train(data.train)).toBe(b.train(data.train));
    expect(a.params.map(p => Array.from(p.data))).toEqual(b.params.map(p => Array.from(p.data)));
    expect(data.train.length + data.validation.length).toBe(Array.from("a little repeated text.\n".repeat(40)).length);
  });
});

import { describe, expect, test } from "bun:test";
import { advance, allowedTokens, distribution, generate, matchesSchema, validityRate, vocabulary } from "./decoder";
describe("fixed-schema grammar", () => {
  test("1000 seeds produce parsed schema-matching JSON", () => {
    const variants = new Set<string>();
    for (let seed = 0; seed < 1000; seed++) {
      const output = generate({ seed, masked: true, temperature: 0.2 + (seed % 19) / 10, noise: (seed % 7) / 2 }, false);
      expect(output.completed).toBe(true);
      const obj = JSON.parse(output.text);
      expect(Object.keys(obj).sort()).toEqual(["action", "confirm", "limit"]);
      expect(["search", "lookup"]).toContain(obj.action);
      expect(Number.isInteger(obj.limit)).toBe(true);
      expect(obj.limit).toBeGreaterThanOrEqual(1);
      expect(obj.limit).toBeLessThanOrEqual(3);
      expect(typeof obj.confirm).toBe("boolean");
      variants.add(output.text);
    }
    expect(variants.size).toBe(12);
  });
  test("mask zeroes forbidden tokens and renormalizes remaining mass", () => {
    const p = distribution(":", "limit-value", { seed: 1, masked: true, noise: 0.5, temperature: 1 });
    expect(p.before.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12);
    expect(p.after.reduce((s, x) => s + x, 0)).toBeCloseTo(1, 12);
    for (let i = 0; i < vocabulary.length; i++) {
      if (!["1", "2", "3"].includes(vocabulary[i]!)) expect(p.after[i]).toBe(0);
    }
    expect(p.after[vocabulary.indexOf("1")]!).toBeGreaterThan(p.before[vocabulary.indexOf("1")]!);
  });
  test("the state machine rejects invalid syntax and early termination", () => {
    expect(allowedTokens("start")).toEqual(["{"]);
    expect(advance("start", "<end>")).toBe("dead");
    expect(advance("limit-value", '"search"')).toBe("dead");
    expect(advance("close", "}")).toBe("end");
    expect(advance("end", "<end>")).toBe("done");
  });
  test("valid JSON alone is insufficient", () => {
    for (const text of ['{}', '{"action":"search","limit":4,"confirm":true}', '{"action":"search","limit":1,"confirm":"true"}', '{"action":"search","limit":1,"confirm":true,"extra":0}', '[]', 'null', '{']) expect(matchesSchema(text)).toBe(false);
    expect(matchesSchema('{"action":"lookup","limit":2,"confirm":false}')).toBe(true);
  });
  test("unmasked generation is genuinely fallible and seed-reproducible", () => {
    const options = { seed: 17, masked: false, noise: 0.5, temperature: 1 };
    expect(generate(options)).toEqual(generate(options));
    expect(validityRate(options)).toBeLessThan(0.5);
    expect(validityRate({ ...options, masked: true })).toBe(1);
  });
});

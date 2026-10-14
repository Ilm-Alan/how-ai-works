import { describe, expect, test } from "bun:test";
import { conversation, DEFAULT_PRICES, type Config } from "./cost";
const config: Config = { parts: [100, 400, 500], history: 0, user: 100, output: 200, turns: 3, cache: true, boundary: 2, changedPart: -1, changeEvery: 1, gapSeconds: 60, ttlSeconds: 300, minimum: 512, prices: DEFAULT_PRICES, prefillRate: 1000, cacheRate: 10000, decodeRate: 100 };
describe("explicit prefix caching", () => {
  test("charges writes instead of base input; discounts later reads", () => {
    const a = conversation(config);
    expect(a.map(t => t.status)).toEqual(["write", "hit", "hit"]);
    expect(a[0]!.cost).toBeCloseTo((1000 * 2.5 + 100 * 2 + 200 * 10) / 1e6, 12);
    expect(a[1]!.cost).toBeCloseTo((1000 * 0.1 + 400 * 2 + 200 * 10) / 1e6, 12);
    expect(a[2]!.input).toBe(1700);
    for (const t of a) expect(t.regular + t.read + t.written).toBe(t.input);
  });
  test("an early edit breaks exact-prefix matching", () => {
    expect(conversation({ ...config, changedPart: 0 }).map(t => t.status)).toEqual(["write", "write", "write"]);
    expect(conversation({ ...config, boundary: 1, minimum: 500, changedPart: 2 }).map(t => t.status)).toEqual(["write", "hit", "hit"]);
  });
  test("minimum length and disabled caching avoid the write premium", () => {
    for (const c of [{ ...config, minimum: 1001 }, { ...config, cache: false }]) {
      for (const t of conversation(c)) { expect(t.cost).toBe(t.uncachedCost); expect(t.written).toBe(0); }
    }
    expect(conversation({ ...config, parts: [0, 0, 0], minimum: 0 })[0]!.written).toBe(0);
  });
  test("reads refresh TTL; expired entries require another write", () => {
    expect(conversation({ ...config, gapSeconds: 299 }).map(t => t.status)).toEqual(["write", "hit", "hit"]);
    expect(conversation({ ...config, gapSeconds: 301 }).map(t => t.status)).toEqual(["write", "write", "write"]);
  });
  test("latency assumptions leave decode unchanged", () => {
    const a = conversation(config);
    expect(a[0]!.seconds).toBeCloseTo(3.1);
    expect(a[1]!.ttft).toBeCloseTo(0.5);
    expect(a[1]!.seconds - a[1]!.ttft).toBeCloseTo(2);
    expect(conversation({ ...config, turns: 0 })).toEqual([]);
  });
});

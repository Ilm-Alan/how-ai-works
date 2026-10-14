import { expect, test } from "bun:test";
import { apiCostPerDay, breakEven, gpusNeeded, selfHostCostPerDay } from "./cost";

const w = { requestsPerDay: 50_000, inputTokens: 2000, outputTokens: 400 };
const api = { input: 1, output: 4 };
const gpu = { gpuHour: 3, tokensPerSecPerGpu: 9000, utilization: 0.5, minGpus: 1 };

test("API cost is tokens times price", () => {
  // 50k × (2000·$1 + 400·$4)/1M = 50k × $0.0036 = $180
  expect(apiCostPerDay(w, api)).toBeCloseTo(180, 9);
});

test("GPUs scale with load and respect the minimum, in whole replicas", () => {
  // 50k × 2400 / 86400 ≈ 1389 tok/s; one GPU gives 4500 tok/s at 50%.
  expect(gpusNeeded(w, gpu)).toBe(1);
  expect(gpusNeeded({ ...w, requestsPerDay: 500_000 }, gpu)).toBe(4);
  expect(gpusNeeded({ ...w, requestsPerDay: 500_000 }, { ...gpu, minGpus: 8 })).toBe(8);
  expect(selfHostCostPerDay(w, gpu)).toBe(72);
});

test("break-even is the first volume where self-hosting is no more expensive", () => {
  const n = breakEven(w, api, gpu)!;
  const at = (k: number) => ({ ...w, requestsPerDay: k });
  expect(selfHostCostPerDay(at(n), gpu)).toBeLessThanOrEqual(apiCostPerDay(at(n), api));
  expect(selfHostCostPerDay(at(n - 1), gpu)).toBeGreaterThan(apiCostPerDay(at(n - 1), api));
  // $72/day ÷ $0.0036/request = 20,000 requests.
  expect(n).toBe(20_000);
});

test("no break-even when the API's marginal cost is below the GPU's", () => {
  expect(breakEven(w, { input: 0.01, output: 0.01 }, gpu, 1e8)).toBeUndefined();
});

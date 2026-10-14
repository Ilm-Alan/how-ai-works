// Daily cost of serving a workload through an API versus on rented GPUs you keep running.

export interface Workload {
  requestsPerDay: number;
  inputTokens: number;
  outputTokens: number;
}

export interface ApiPrice {
  /** USD per million input tokens. */
  input: number;
  /** USD per million output tokens. */
  output: number;
}

export interface SelfHost {
  /** USD per GPU-hour. */
  gpuHour: number;
  /** Measured total (input + output) tokens per second one GPU sustains at your latency target. */
  tokensPerSecPerGpu: number;
  /** Average load as a fraction of capacity; real traffic is bursty, so capacity is sized for peaks. */
  utilization: number;
  /** GPUs needed just to hold the model. */
  minGpus: number;
}

export function apiCostPerDay(w: Workload, p: ApiPrice): number {
  return (w.requestsPerDay * (w.inputTokens * p.input + w.outputTokens * p.output)) / 1e6;
}

export function gpusNeeded(w: Workload, s: SelfHost): number {
  const tokensPerSec = (w.requestsPerDay * (w.inputTokens + w.outputTokens)) / 86_400;
  const forLoad = Math.ceil(tokensPerSec / (s.tokensPerSecPerGpu * s.utilization));
  return Math.max(s.minGpus, Math.ceil(forLoad / s.minGpus) * s.minGpus);
}

export function selfHostCostPerDay(w: Workload, s: SelfHost): number {
  return gpusNeeded(w, s) * 24 * s.gpuHour;
}

/**
 * Smallest request volume at which self-hosting is no more expensive than the API, searching
 * whole requests per day up to `limit`. Returns undefined if the API is cheaper everywhere in range.
 */
export function breakEven(w: Workload, p: ApiPrice, s: SelfHost, limit = 1e9): number | undefined {
  const at = (n: number) => ({ ...w, requestsPerDay: n });
  const cheaper = (n: number) => selfHostCostPerDay(at(n), s) <= apiCostPerDay(at(n), p);
  // Self-hosting cost is a step function, so scan step boundaries: each step's cheapest point is its right end.
  const perGpuRequests = (s.tokensPerSecPerGpu * s.utilization * 86_400) / (w.inputTokens + w.outputTokens);
  for (let g = s.minGpus; g * perGpuRequests <= limit * 2; g += s.minGpus) {
    const lo = Math.max(1, Math.floor((g - s.minGpus) * perGpuRequests) + 1);
    const hi = Math.min(limit, Math.floor(g * perGpuRequests));
    if (hi < lo || !cheaper(hi)) continue;
    // Within this step self-host cost is constant and API cost rises with n: find the first n where it wins.
    let a = lo;
    let b = hi;
    while (a < b) {
      const mid = Math.floor((a + b) / 2);
      if (cheaper(mid)) b = mid;
      else a = mid + 1;
    }
    return a;
  }
  return undefined;
}

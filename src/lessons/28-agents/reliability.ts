import type { Rng } from "../../lib/rng";

/**
 * A task of `steps` sequential steps. Each attempt at a step succeeds with probability `p`.
 * A failed attempt is caught by verification with probability `detect`; caught failures are retried,
 * up to `retries` extra attempts per step. An uncaught failure silently corrupts the task.
 * A caught failure with no retries left makes the agent stop and report failure.
 */
export interface Params {
  p: number;
  steps: number;
  detect: number;
  retries: number;
}

export interface Outcome {
  success: number;
  /** Finished but wrong, without noticing. */
  silent: number;
  /** Stopped and reported that it failed. */
  stopped: number;
}

export function exact({ p, steps, detect, retries }: Params): Outcome {
  const caught = (1 - p) * detect;
  // Sum over the number of caught-and-retried failures before the step resolves.
  let geo = 0;
  for (let j = 0; j <= retries; j++) geo += caught ** j;
  const s = p * geo;
  const u = (1 - p) * (1 - detect) * geo;
  const g = caught ** (retries + 1);
  const success = s ** steps;
  // Probability that the first unsuccessful step occurs at all, split by how it ended.
  const anyFail = s === 1 ? 0 : (1 - success) / (1 - s);
  return { success, silent: u * anyFail, stopped: g * anyFail };
}

export function simulate(params: Params, trials: number, r: Rng): Outcome {
  const out = { success: 0, silent: 0, stopped: 0 };
  for (let t = 0; t < trials; t++) {
    let result: keyof Outcome = "success";
    for (let k = 0; k < params.steps && result === "success"; k++) {
      for (let attempt = 0; ; attempt++) {
        if (r.next() < params.p) break;
        if (r.next() >= params.detect) {
          result = "silent";
          break;
        }
        if (attempt === params.retries) {
          result = "stopped";
          break;
        }
      }
    }
    out[result]++;
  }
  return { success: out.success / trials, silent: out.silent / trials, stopped: out.stopped / trials };
}

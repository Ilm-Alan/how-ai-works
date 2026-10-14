import { rng } from "../../lib/rng";

export function expectedTokens(acceptance: number, draftLength: number): number {
  if (acceptance === 1) return draftLength + 1;
  if (acceptance === 0) return 1;
  // expm1 avoids cancellation near acceptance = 1.
  return -Math.expm1((draftLength + 1) * Math.log(acceptance)) / (1 - acceptance);
}

export function speculativeSpeedup(acceptance: number, draftLength: number, draftCost: number, verifyCost = 1): number {
  return expectedTokens(acceptance, draftLength) / (verifyCost + draftLength * draftCost);
}

export function simulate(acceptance: number, draftLength: number, trials: number, seed: number) {
  const r = rng(seed);
  const histogram = new Uint32Array(draftLength + 2);
  let total = 0, square = 0;
  for (let i = 0; i < trials; i++) {
    let accepted = 0;
    while (accepted < draftLength && r.next() < acceptance) accepted++;
    const emitted = accepted + 1; // correction token, or bonus token if all drafts pass
    histogram[emitted]!++;
    total += emitted;
    square += emitted * emitted;
  }
  const mean = total / trials;
  const variance = trials > 1 ? (square - trials * mean * mean) / (trials - 1) : 0;
  return { mean, standardError: Math.sqrt(Math.max(0, variance) / trials), histogram };
}

// Idealized dense-model bound: one shared weight read plus separate KV reads per sequence.
export function decodeBound(bandwidth: number, modelBytes: number, batch: number, kvReadBytes = 0) {
  const stepSeconds = (modelBytes + batch * kvReadBytes) / bandwidth;
  return { stepSeconds, perSequence: 1 / stepSeconds, aggregate: batch / stepSeconds };
}

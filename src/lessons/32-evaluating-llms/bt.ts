import { rng } from "../../lib/rng";

export interface Vote { a: number; b: number; winner: number }
export const strengths = [-0.75, -0.45, -0.15, 0.15, 0.45, 0.75];
export const winProbability = (a: number, b: number) => 1 / (1 + Math.exp(b - a));

/** MM maximum-likelihood fit with symmetric pseudovotes to keep sparse fits finite. */
export function fitBT(n: number, votes: readonly Vote[], prior = 0.5): number[] {
  const wins = new Float64Array(n);
  const games = new Float64Array(n * n);
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
    wins[i]! += prior; wins[j]! += prior;
    games[i * n + j] = games[j * n + i] = 2 * prior;
  }
  for (const v of votes) {
    wins[v.winner]!++;
    games[v.a * n + v.b]!++; games[v.b * n + v.a]!++;
  }
  let p = new Float64Array(n).fill(1);
  const next = new Float64Array(n);
  for (let step = 0; step < 400; step++) {
    let delta = 0;
    for (let i = 0; i < n; i++) {
      let denominator = 0;
      for (let j = 0; j < n; j++) if (i !== j) denominator += games[i * n + j]! / (p[i]! + p[j]!);
      next[i] = denominator ? Math.max(1e-12, wins[i]! / denominator) : 1;
    }
    const mean = next.reduce((s, v) => s + Math.log(v), 0) / n;
    for (let i = 0; i < n; i++) {
      next[i]! /= Math.exp(mean);
      delta = Math.max(delta, Math.abs(Math.log(next[i]! / p[i]!)));
      p[i] = next[i]!;
    }
    if (delta < 1e-7) break;
  }
  return Array.from(p, Math.log);
}

export function simulateVotes(count: number, seed: number, positionBias = 0, trueStrengths = strengths): Vote[] {
  const r = rng(seed);
  return Array.from({ length: count }, () => {
    const a = r.int(trueStrengths.length);
    let b = r.int(trueStrengths.length - 1);
    if (b >= a) b++;
    return { a, b, winner: r.next() < winProbability(trueStrengths[a]! + positionBias, trueStrengths[b]!) ? a : b };
  });
}

export function bootstrapBT(n: number, votes: readonly Vote[], seed: number, repetitions = 100): [number, number][] {
  const r = rng(seed);
  const samples: number[][] = Array.from({ length: n }, () => []);
  for (let k = 0; k < repetitions; k++) {
    const fit = fitBT(n, Array.from({ length: votes.length }, () => votes[r.int(votes.length)]!));
    fit.forEach((v, i) => samples[i]!.push(v));
  }
  return samples.map(values => {
    values.sort((a, b) => a - b);
    return [values[Math.floor(repetitions * 0.025)]!, values[Math.min(repetitions - 1, Math.floor(repetitions * 0.975))]!];
  });
}

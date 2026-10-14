import type { Rng } from "../../lib/rng";
export const candidates = [
  { label: "Wrong, brief", proxy: 0, truth: 0 },
  { label: "Partly useful", proxy: 0.6, truth: 0.5 },
  { label: "Correct and clear", proxy: 1.1, truth: 1 },
  { label: "Verbose nonsense", proxy: 1.3, truth: 0.05 },
];
export const reference = [0.4, 0.31, 0.19, 0.1];
export const initialLogits = () => reference.map(Math.log);
export function softmax(z: number[]): number[] {
  const max = Math.max(...z); const e = z.map(x => Math.exp(x - max)); const sum = e.reduce((a, b) => a + b, 0);
  return e.map(x => x / sum);
}
export function metrics(z: number[]) {
  const p = softmax(z);
  return { p, proxy: p.reduce((s, x, i) => s + x * candidates[i]!.proxy, 0), truth: p.reduce((s, x, i) => s + x * candidates[i]!.truth, 0), kl: p.reduce((s, x, i) => s + x * Math.log(x / reference[i]!), 0) };
}
/** Exact derivative of E_p[r] - beta KL(p || reference), with respect to logits. */
export function gradient(z: number[], beta: number): number[] {
  const { p, proxy, kl } = metrics(z);
  return p.map((x, i) => x * (candidates[i]!.proxy - proxy - beta * (Math.log(x / reference[i]!) - kl)));
}
export function groupAdvantages(rewards: number[]): number[] {
  const mean = rewards.reduce((a, b) => a + b, 0) / rewards.length;
  const sd = Math.sqrt(rewards.reduce((s, x) => s + (x - mean) ** 2, 0) / rewards.length);
  return rewards.map(x => sd === 0 ? 0 : (x - mean) / sd);
}
/** One on-policy group step; illustrates GRPO advantages, not PPO clipping or rollout reuse. */
export function step(z: number[], beta: number, lr: number, random?: Rng, groupSize = 16): number[] {
  let g = gradient(z, beta);
  if (random) {
    const { p, kl } = metrics(z);
    const ids = Array.from({ length: groupSize }, () => {
      let u = random.next(); for (let i = 0; i < p.length - 1; i++) { u -= p[i]!; if (u < 0) return i; } return p.length - 1;
    });
    const a = groupAdvantages(ids.map(i => candidates[i]!.proxy));
    g = p.map((x, i) => a.reduce((sum, advantage, j) => sum + advantage * ((ids[j] === i ? 1 : 0) - x), 0) / groupSize - beta * x * (Math.log(x / reference[i]!) - kl));
  }
  return z.map((x, i) => x + lr * g[i]!);
}

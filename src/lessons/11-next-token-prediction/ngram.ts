import type { Rng } from "../../lib/rng";
export interface Model { alphabet: string[]; tables: Map<string, Float64Array>[]; order: number }
export interface Filters { temperature: number; topK: number; topP: number; minP: number }
export function train(text: string, order: number, vocabulary = text): Model {
  if (!Number.isInteger(order) || order < 1 || order > 6) throw new Error("Order must be 1–6");
  const chars = [...text], alphabet = [...new Set([...vocabulary, ...chars])].sort(), ids = new Map(alphabet.map((c, i) => [c, i]));
  const tables = Array.from({ length: order }, () => new Map<string, Float64Array>());
  for (let i = 0; i < chars.length; i++) for (let k = 0; k < order && k <= i; k++) {
    const context = chars.slice(i - k, i).join(""); let counts = tables[k]!.get(context);
    if (!counts) { counts = new Float64Array(alphabet.length); tables[k]!.set(context, counts); }
    counts[ids.get(chars[i]!)!]!++;
  }
  return { alphabet, tables, order };
}
/** Longest observed suffix backs off; additive smoothing keeps known characters possible. */
export function distribution(model: Model, context: string): { probabilities: number[]; matched: number } {
  const chars = [...context];
  for (let k = Math.min(model.order - 1, chars.length); k >= 0; k--) {
    const counts = model.tables[k]!.get(chars.slice(chars.length - k).join(""));
    if (!counts) continue;
    const total = counts.reduce((sum, c) => sum + c, 0) + 0.1 * counts.length;
    return { probabilities: [...counts].map(c => (c + 0.1) / total), matched: k };
  }
  return { probabilities: [], matched: 0 };
}
export function filter(probabilities: number[], options: Filters): number[] {
  if (!probabilities.length) return [];
  if (options.temperature <= 0) {
    const best = probabilities.indexOf(Math.max(...probabilities)); return probabilities.map((_, i) => Number(i === best));
  }
  const logits = probabilities.map(p => p > 0 ? Math.log(p) / options.temperature : -Infinity);
  const max = Math.max(...logits); if (!Number.isFinite(max)) return probabilities.map(() => 0);
  const p = logits.map(l => Math.exp(l - max)), sum = p.reduce((a, b) => a + b, 0);
  for (let i = 0; i < p.length; i++) p[i]! /= sum;
  const sorted = p.map((value, i) => ({ value, i })).sort((a, b) => b.value - a.value);
  let mass = 0;
  for (let rank = 0; rank < sorted.length; rank++) {
    const item = sorted[rank]!;
    const keep = rank === 0 || ((!options.topK || rank < options.topK) && mass < options.topP && item.value >= options.minP * sorted[0]!.value);
    mass += item.value;
    if (!keep) p[item.i] = 0;
  }
  const kept = p.reduce((a, b) => a + b, 0);
  return p.map(v => v / kept);
}
export function sample(p: number[], random: Rng): number {
  if (!p.length) return -1;
  let u = random.next(); for (let i = 0; i < p.length; i++) { u -= p[i]!; if (u < 0) return i; } return p.length - 1;
}
export function generate(model: Model, prompt: string, length: number, options: Filters, random: Rng): string {
  let text = prompt;
  if (!model.alphabet.length) return text;
  for (let i = 0; i < length; i++) { const p = filter(distribution(model, text).probabilities, options); text += model.alphabet[sample(p, random)]!; }
  return text;
}
export function loss(model: Model, text: string, prefix = ""): { nats: number; perplexity: number; unknown: number } {
  const chars = [...text]; let total = 0, context = prefix, unknown = 0;
  for (const c of chars) {
    const id = model.alphabet.indexOf(c), p = distribution(model, context).probabilities;
    if (id < 0) { unknown++; total = Infinity; } else total -= Math.log(p[id]!);
    context = [...(context + c)].slice(-(model.order - 1 || 1)).join("");
  }
  const nats = chars.length ? total / chars.length : 0; return { nats, perplexity: Math.exp(nats), unknown };
}

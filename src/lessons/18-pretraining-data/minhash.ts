import { rng } from "../../lib/rng";

export function shingles(text: string, size: number): Set<string> {
  if (!Number.isInteger(size) || size < 1) throw new Error("Positive shingle size required");
  const words = text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  const result = new Set<string>();
  for (let i = 0; i + size <= words.length; i++) result.add(words.slice(i, i + size).join(" "));
  return result;
}
export function jaccard(a: Set<string>, b: Set<string>): number {
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection++;
  const union = a.size + b.size - intersection;
  return union ? intersection / union : 1;
}
/** Exact seeded random permutations of the corpus vocabulary, practical for this tiny lab. */
export function signatures(sets: Set<string>[], count: number, seed = 1): number[][] {
  if (!Number.isInteger(count) || count < 1) throw new Error("Positive hash count required");
  const vocabulary = [...new Set(sets.flatMap(s => [...s]))].sort();
  const ids = new Map(vocabulary.map((s, i) => [s, i]));
  const members = sets.map(s => [...s].map(item => ids.get(item)!));
  const result = sets.map(() => new Array<number>(count).fill(Infinity));
  const order = vocabulary.map((_, i) => i);
  const ranks = new Int32Array(order.length);
  const r = rng(seed);
  for (let k = 0; k < count; k++) {
    r.shuffle(order);
    order.forEach((id, rank) => { ranks[id] = rank; });
    members.forEach((items, i) => {
      for (const id of items) result[i]![k] = Math.min(result[i]![k]!, ranks[id]!);
    });
  }
  return result;
}
export function estimate(a: number[], b: number[]): number {
  if (!a.length || a.length !== b.length) throw new Error("Equal nonempty signatures required");
  let same = 0;
  for (let i = 0; i < a.length; i++) if (a[i] === b[i]) same++;
  return same / a.length;
}
export function candidateProbability(s: number, bands: number, rows: number): number {
  if (!(s >= 0 && s <= 1) || !Number.isInteger(bands) || bands < 1 || !Number.isInteger(rows) || rows < 1) throw new Error("Invalid LSH parameters");
  return 1 - (1 - s ** rows) ** bands;
}
/** Unused trailing signature entries are ignored; empty documents are excluded. */
export function candidates(sigs: number[][], bands: number, rows: number): [number, number][] {
  candidateProbability(0, bands, rows);
  if (sigs.some(s => s.length < bands * rows)) throw new Error("Not enough signature entries");
  const pairs = new Map<string, [number, number]>();
  for (let band = 0; band < bands; band++) {
    const buckets = new Map<string, number[]>();
    sigs.forEach((sig, i) => {
      if (!Number.isFinite(sig[0])) return;
      const key = sig.slice(band * rows, (band + 1) * rows).join(",");
      const bucket = buckets.get(key) ?? [];
      for (const j of bucket) pairs.set(`${j}:${i}`, [j, i]);
      bucket.push(i);
      buckets.set(key, bucket);
    });
  }
  return [...pairs.values()];
}

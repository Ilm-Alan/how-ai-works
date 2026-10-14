import { rng } from "../../lib/rng";
export interface WordMatrix { words: string[]; matrix: Float64Array; size: number }
const stop = new Set("the a an and or of to in on at by for from with as is was were be been being it its i you he she they we my your his her their our me him them us that this these those said alice very not but so had have has would could should did do does what how who which when then there here all any some no if out up down into about again now than more much one little only can don t s ll m re ve chapter are wasn didn wouldn couldn isn herself himself itself myself yourself themselves just quite really rather well way thing things something anything nothing everything like know think thought say asked went go going got get getting come came see seen looking looked look tell told replied began went still never ever always yet last first next must ought before after over under even enough too back once twice such same other another both either neither every each many most also already soon away off upon through without made make might seem seemed minute afraid poor".split(" "));
export function cooccurrence(text: string, window = 4, limit = 160): WordMatrix {
  const sentences = text.toLowerCase().replaceAll("\n", " ").split(/[.!?]+/).map(s => (s.match(/[a-z]+/g) ?? []).filter(w => w.length > 2 && !stop.has(w)));
  const freq = new Map<string, number>();
  for (const sentence of sentences) for (const w of sentence) if (w.length > 2 && !stop.has(w)) freq.set(w, (freq.get(w) ?? 0) + 1);
  const words = [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit).map(p => p[0]);
  const ids = new Map(words.map((w, i) => [w, i]));
  const n = words.length, matrix = new Float64Array(n * n);
  for (const sentence of sentences) for (let i = 0; i < sentence.length; i++) {
    const a = ids.get(sentence[i]!); if (a === undefined) continue;
    for (let j = Math.max(0, i - window); j <= Math.min(sentence.length - 1, i + window); j++) {
      const b = ids.get(sentence[j]!);
      if (i !== j && b !== undefined) matrix[a * n + b]! += 1 / Math.abs(j - i);
    }
  }
  return { words, matrix, size: n };
}
export function ppmi(counts: Float64Array, n: number): Float64Array {
  const rows = new Float64Array(n), cols = new Float64Array(n), out = new Float64Array(n * n);
  let total = 0;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const c = counts[i * n + j]!; rows[i]! += c; cols[j]! += c; total += c; }
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const c = counts[i * n + j]!;
    if (c > 0) out[i * n + j] = Math.max(0, Math.log(c * total / (rows[i]! * cols[j]!)));
  }
  return out;
}
export interface SVD { vectors: Float64Array[]; singular: number[] }
/** Yields after each power step, so the browser can time-slice training. */
export function* svdSteps(a: Float64Array, n: number, rank: number, iterations = 35): Generator<void, SVD> {
  const right: Float64Array[] = [], left: Float64Array[] = [], singular: number[] = [], r = rng(19);
  const u = new Float64Array(n), v = new Float64Array(n), next = new Float64Array(n);
  for (let k = 0; k < Math.min(n, rank); k++) {
    for (let j = 0; j < n; j++) v[j] = r.normal();
    for (let step = 0; step < iterations; step++) {
      u.fill(0); next.fill(0);
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) u[i]! += a[i * n + j]! * v[j]!;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) next[j]! += a[i * n + j]! * u[i]!;
      for (const prev of right) {
        let dot = 0; for (let j = 0; j < n; j++) dot += next[j]! * prev[j]!;
        for (let j = 0; j < n; j++) next[j]! -= dot * prev[j]!;
      }
      const norm = Math.hypot(...next);
      if (norm < 1e-10) break;
      for (let j = 0; j < n; j++) v[j] = next[j]! / norm;
      yield;
    }
    u.fill(0);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) u[i]! += a[i * n + j]! * v[j]!;
    const sigma = Math.hypot(...u); if (sigma < 1e-8) break;
    right.push(v.slice()); left.push(u.slice()); singular.push(sigma);
  }
  return { vectors: Array.from({ length: n }, (_, i) => Float64Array.from(left, col => col[i]!)), singular };
}
export function svd(a: Float64Array, n: number, rank: number): SVD {
  const steps = svdSteps(a, n, rank); let result = steps.next(); while (!result.done) result = steps.next(); return result.value;
}
export function cosine(a: ArrayLike<number>, b: ArrayLike<number>, dims = a.length): number {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < dims; i++) { dot += a[i]! * b[i]!; aa += a[i]! ** 2; bb += b[i]! ** 2; }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}
export function neighbors(query: ArrayLike<number>, words: string[], vectors: Float64Array[], dims: number, exclude: string[] = []): { word: string; score: number }[] {
  return words.map((word, i) => ({ word, score: cosine(query, vectors[i]!, dims) })).filter(p => !exclude.includes(p.word)).sort((a, b) => b.score - a.score).slice(0, 8);
}

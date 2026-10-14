export interface Document { id: string; title: string; text: string }
export interface Query { text: string; relevant: string[] }
export interface Result { id: string; score: number }
const STOP: Record<string, true> = { a: true, an: true, the: true, is: true, are: true, of: true, to: true, for: true, and: true, or: true, in: true, on: true, with: true, from: true, by: true, it: true, this: true, that: true, be: true, can: true, at: true, as: true };
export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter(t => !STOP[t]);
}
export interface Index { docs: Document[]; counts: Map<string, number>[]; df: Map<string, number>; lengths: number[]; average: number }
export function buildIndex(docs: Document[]): Index {
  const df = new Map<string, number>();
  const lengths: number[] = [];
  const counts = docs.map(d => {
    const words = tokenize(`${d.title} ${d.text}`);
    lengths.push(words.length);
    const terms = new Map<string, number>();
    for (const t of words) terms.set(t, (terms.get(t) ?? 0) + 1);
    for (const t of terms.keys()) df.set(t, (df.get(t) ?? 0) + 1);
    return terms;
  });
  return { docs, counts, df, lengths, average: lengths.reduce((s, n) => s + n, 0) / (docs.length || 1) };
}
function ranked(results: Result[]): Result[] {
  return results.filter(r => r.score > 1e-12).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
}
export function bm25(index: Index, query: string, k1 = 1.2, b = 0.75): Result[] {
  const terms = [...new Set(tokenize(query))];
  const n = index.docs.length;
  return ranked(index.docs.map((d, i) => {
    let score = 0;
    for (const t of terms) {
      const f = index.counts[i]!.get(t) ?? 0;
      if (!f) continue;
      const df = index.df.get(t)!;
      const idf = Math.log(1 + (n - df + 0.5) / (df + 0.5));
      score += idf * f * (k1 + 1) / (f + k1 * (1 - b + b * index.lengths[i]! / index.average));
    }
    return { id: d.id, score };
  }));
}
export function rrf(lists: Result[][], k = 60): Result[] {
  const scores = new Map<string, number>();
  for (const list of lists) {
    const seen = new Set<string>();
    for (let i = 0; i < list.length; i++) {
      const id = list[i]!.id;
      if (seen.has(id)) continue;
      seen.add(id);
      scores.set(id, (scores.get(id) ?? 0) + 1 / (k + i + 1));
    }
  }
  return ranked([...scores].map(([id, score]) => ({ id, score })));
}
export function metrics(results: Result[], relevant: string[], k: number): { recall: number; reciprocalRank: number } {
  const labels = new Set(relevant);
  const found = new Set(results.slice(0, Math.max(0, k)).filter(r => labels.has(r.id)).map(r => r.id));
  const first = results.findIndex(r => labels.has(r.id));
  return { recall: labels.size ? found.size / labels.size : 0, reciprocalRank: first < 0 ? 0 : 1 / (first + 1) };
}
export interface LSA { index: Index; vocabulary: Map<string, number>; idf: number[]; basis: number[][]; vectors: number[][] }
/** Truncated SVD via a Jacobi eigensolve of the document Gram matrix XXᵀ. */
export function fitLSA(index: Index, dimensions = 16): LSA {
  const vocabulary = new Map([...index.df.keys()].sort().map((t, i) => [t, i]));
  const idf = [...vocabulary.keys()].map(t => 1 + Math.log((index.docs.length + 1) / (index.df.get(t)! + 1)));
  const x = index.counts.map(counts => {
    const v = Array<number>(vocabulary.size).fill(0);
    for (const [t, f] of counts) { const j = vocabulary.get(t)!; v[j] = (1 + Math.log(f)) * idf[j]!; }
    return v;
  });
  const n = x.length;
  const gram = x.map(a => x.map(b => a.reduce((s, v, j) => s + v * b[j]!, 0)));
  const u = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) => +(i === j)));
  for (let sweep = 0; sweep < 40; sweep++) {
    let largest = 0;
    for (let p = 0; p < n; p++) for (let q = p + 1; q < n; q++) {
      const off = gram[p]![q]!;
      largest = Math.max(largest, Math.abs(off));
      if (Math.abs(off) < 1e-10) continue;
      const theta = 0.5 * Math.atan2(2 * off, gram[q]![q]! - gram[p]![p]!);
      const c = Math.cos(theta), s = Math.sin(theta);
      const pp = gram[p]![p]!, qq = gram[q]![q]!;
      for (let r = 0; r < n; r++) if (r !== p && r !== q) {
        const rp = gram[r]![p]!, rq = gram[r]![q]!;
        gram[r]![p] = gram[p]![r] = c * rp - s * rq;
        gram[r]![q] = gram[q]![r] = s * rp + c * rq;
      }
      gram[p]![p] = c * c * pp - 2 * s * c * off + s * s * qq;
      gram[q]![q] = s * s * pp + 2 * s * c * off + c * c * qq;
      gram[p]![q] = gram[q]![p] = 0;
      for (let r = 0; r < n; r++) {
        const rp = u[r]![p]!, rq = u[r]![q]!;
        u[r]![p] = c * rp - s * rq; u[r]![q] = s * rp + c * rq;
      }
    }
    if (largest < 1e-8) break;
  }
  const components = Array.from({ length: n }, (_, i) => i).sort((a, b) => gram[b]![b]! - gram[a]![a]!).filter(i => gram[i]![i]! > 1e-8).slice(0, dimensions);
  const basis = components.map(i => {
    const sigma = Math.sqrt(gram[i]![i]!);
    return Array.from({ length: vocabulary.size }, (_, j) => x.reduce((sum, v, d) => sum + v[j]! * u[d]![i]!, 0) / sigma);
  });
  const vectors = x.map(v => basis.map(axis => axis.reduce((sum, a, j) => sum + a * v[j]!, 0)));
  return { index, vocabulary, idf, basis, vectors };
}
export function lsaSearch(model: LSA, query: string, dimensions = model.basis.length): Result[] {
  const counts = new Map<string, number>();
  for (const t of tokenize(query)) counts.set(t, (counts.get(t) ?? 0) + 1);
  const q = Array<number>(model.vocabulary.size).fill(0);
  for (const [t, f] of counts) { const j = model.vocabulary.get(t); if (j !== undefined) q[j] = (1 + Math.log(f)) * model.idf[j]!; }
  const dim = Math.min(dimensions, model.basis.length);
  const embedding = model.basis.slice(0, dim).map(axis => axis.reduce((s, a, j) => s + a * q[j]!, 0));
  const qnorm = Math.sqrt(embedding.reduce((s, a) => s + a * a, 0));
  if (qnorm === 0) return [];
  return ranked(model.index.docs.map((d, i) => {
    const vector = model.vectors[i]!;
    let dot = 0, norm = 0;
    for (let j = 0; j < dim; j++) { dot += embedding[j]! * vector[j]!; norm += vector[j]! * vector[j]!; }
    return { id: d.id, score: norm ? dot / (qnorm * Math.sqrt(norm)) : 0 };
  }));
}

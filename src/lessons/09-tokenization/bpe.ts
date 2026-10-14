export interface Merge { left: number; right: number; id: number; count: number }
export interface BPE { merges: Merge[]; vocab: Uint8Array[] }
const bytes = new TextEncoder();
export const pieces = (text: string): string[] => text.match(/\s+|[\p{L}\p{M}]+|\p{N}+|[^\s\p{L}\p{M}\p{N}]+/gu) ?? [];
function mergePair(ids: number[], left: number, right: number, id: number): number[] {
  const out: number[] = [];
  for (let i = 0; i < ids.length; i++) {
    if (ids[i] === left && ids[i + 1] === right) { out.push(id); i++; }
    else out.push(ids[i]!);
  }
  return out;
}
/** One iterator step trains one merge; pre-token boundaries never merge. */
export function* trainSteps(text: string, maxMerges: number): Generator<BPE, BPE> {
  if (!Number.isInteger(maxMerges) || maxMerges < 0) throw new Error("Invalid merge count");
  let words = pieces(text).map(w => [...bytes.encode(w)]);
  const model: BPE = { merges: [], vocab: Array.from({ length: 256 }, (_, i) => Uint8Array.of(i)) };
  for (let step = 0; step < maxMerges; step++) {
    const counts = new Map<string, number>();
    for (const word of words) for (let i = 0; i + 1 < word.length; i++) {
      const key = `${word[i]},${word[i + 1]}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    let best = "", count = 0;
    for (const [key, n] of counts) if (n > count) { best = key; count = n; }
    if (!best) break;
    const [left, right] = best.split(",").map(Number) as [number, number];
    const id = model.vocab.length;
    model.vocab.push(Uint8Array.from([...model.vocab[left]!, ...model.vocab[right]!]));
    model.merges.push({ left, right, id, count });
    words = words.map(w => mergePair(w, left, right, id));
    yield model;
  }
  return model;
}
export function train(text: string, maxMerges: number): BPE {
  const iter = trainSteps(text, maxMerges);
  let step = iter.next();
  while (!step.done) step = iter.next();
  return step.value;
}
export function encode(text: string, model: BPE, mergeCount = model.merges.length): number[] {
  const active = model.merges.slice(0, Math.max(0, mergeCount));
  return pieces(text).flatMap(word => {
    let ids = [...bytes.encode(word)];
    for (const m of active) ids = mergePair(ids, m.left, m.right, m.id);
    return ids;
  });
}
export function decode(ids: number[], model: BPE): string {
  return new TextDecoder().decode(Uint8Array.from(ids.flatMap(id => [...model.vocab[id]!])));
}
export function displayToken(id: number, model: BPE): string {
  const b = model.vocab[id]!;
  const s = new TextDecoder("utf-8", { fatal: true });
  try { return s.decode(b).replaceAll(" ", "␠").replaceAll("\n", "↵"); }
  catch { return [...b].map(v => `\\x${v.toString(16).padStart(2, "0")}`).join(""); }
}

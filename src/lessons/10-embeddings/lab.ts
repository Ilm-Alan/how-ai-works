import { button, fmt, h, loop, note, readout, row, select, slider, textInput } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { corpus } from "./corpus";
import { cooccurrence, neighbors, ppmi, svdSteps, type SVD } from "./vectors";
export function mount(root: HTMLElement) {
  const data = cooccurrence(corpus), matrix = ppmi(data.matrix, data.size);
  let steps = svdSteps(matrix, data.size, 20), fitted: SVD | undefined, dims = 12, chosen = "turtle", a = "hatter", b = "tea", c = "turtle", progress = 0;
  const view = h("div"), result = h("pre"), analogy = h("pre"), status = readout("building vectors");
  const plot = chart(view, { height: 320, x: [-1, 1], y: [-1, 1], xLabel: "direction 1", yLabel: "direction 2" });
  function draw() {
    plot.clear();
    if (!fitted) { result.textContent = "Press Start to compute vectors from the corpus."; analogy.textContent = ""; return; }
    const ids = data.words.indexOf(chosen), vectors = fitted.vectors;
    const near = neighbors(vectors[ids]!, data.words, vectors, dims, [chosen]);
    result.textContent = `Neighbors of ${chosen} (cosine):\n` + near.map(p => `${p.word.padEnd(15)} ${fmt(p.score)}`).join("\n");
    const xs = vectors.map(v => v[0]!), ys = vectors.map(v => v[1]!);
    plot.x = [Math.min(...xs) - 1, Math.max(...xs) + 1]; plot.y = [Math.min(...ys) - 1, Math.max(...ys) + 1]; plot.clear();
    plot.points(xs, ys, { color: plot.pal.muted, r: 2 });
    for (const word of [chosen, ...near.slice(0, 5).map(p => p.word)]) { const i = data.words.indexOf(word); plot.points([xs[i]!], [ys[i]!], { color: plot.pal.accent, r: 4 }); plot.text(xs[i]!, ys[i]!, word); }
    const indices = [a, b, c].map(w => data.words.indexOf(w.toLowerCase().trim()));
    if (indices.some(i => i < 0)) { analogy.textContent = "Choose three words from the word list."; return; }
    const query = Float64Array.from(vectors[indices[0]!]!, (v, i) => v - vectors[indices[1]!]![i]! + vectors[indices[2]!]![i]!);
    analogy.textContent = `${a} − ${b} + ${c}:\n` + neighbors(query, data.words, vectors, dims, [a, b, c]).slice(0, 5).map(p => `${p.word}: ${fmt(p.score)}`).join("\n");
  }
  const runner = loop(root, () => {
    const step = steps.next(); progress++;
    if (step.done) { fitted = step.value; status.set(`${data.size} words × ${fitted.singular.length} dimensions`); draw(); return false; }
    status.set(`power step ${progress}/700`); return true;
  }, 8);
  function reset() { runner.stop(); fitted = undefined; progress = 0; steps = svdSteps(matrix, data.size, 20); status.set("not fitted"); draw(); }
  root.append(note("The lab counts nearby words in four chapters of Alice’s Adventures in Wonderland."),
    row(button("Start", () => runner.start(), "primary"), button("Pause", () => runner.stop()), button("Reset", reset), status),
    row(select({ label: "word", options: data.words.slice().sort().map(w => ({ value: w, label: w })), value: chosen, onChange: v => { chosen = v; draw(); } }), slider({ label: "similarity dimensions", min: 2, max: 20, step: 1, value: dims, onInput: v => { dims = v; draw(); } })), view, result,
    row(textInput({ label: "start with word", value: a, onInput: v => { a = v; draw(); } }), textInput({ label: "subtract word", value: b, onInput: v => { b = v; draw(); } }), textInput({ label: "add word", value: c, onInput: v => { c = v; draw(); } })), analogy,
    note("Rankings use all selected dimensions; the plot shows two."));
  reset(); return () => runner.stop();
}

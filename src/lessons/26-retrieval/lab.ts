import { fmt, h, note, readout, row, select, slider, textInput } from "../../ui/kit";
import { documents, queries } from "./corpus";
import { bm25, buildIndex, fitLSA, lsaSearch, metrics, rrf, type Result } from "./search";
export function mount(root: HTMLElement) {
  const index = buildIndex(documents);
  const model = fitLSA(index, 16);
  let method = "hybrid", query = queries[0]!.text, k1 = 1.2, b = 0.75, dimensions = 8, cutoff = 5, fusionK = 60;
  const recall = readout("Average recall: words / vectors / combined");
  const mrr = readout("Average first-hit score: words / vectors / combined");
  const individual = readout("This query: recall / first-hit score");
  const results = h("div");
  const input = textInput({ label: "search text", value: query, onInput: v => { query = v; draw(); } });
  function rankings(text: string): Result[][] {
    const lexical = bm25(index, text, k1, b);
    const dense = lsaSearch(model, text, dimensions);
    return [lexical, dense, rrf([lexical, dense], fusionK)];
  }
  function draw() {
    const scores = [0, 0, 0], reciprocal = [0, 0, 0];
    for (const q of queries) rankings(q.text).forEach((list, i) => {
      const m = metrics(list, q.relevant, cutoff); scores[i]! += m.recall; reciprocal[i]! += m.reciprocalRank;
    });
    recall.set(scores.map(s => fmt(s / queries.length, 3)).join(" / "));
    mrr.set(reciprocal.map(s => fmt(s / queries.length, 3)).join(" / "));
    const list = rankings(query)[method === "bm25" ? 0 : method === "lsa" ? 1 : 2]!;
    const label = queries.find(q => q.text === query);
    if (label) { const m = metrics(list, label.relevant, cutoff); individual.set(`${fmt(m.recall)} / ${fmt(m.reciprocalRank)}`); }
    else individual.set("Custom query; no answer labels");
    results.replaceChildren(h("ol", null, ...list.slice(0, cutoff).map(r => {
      const d = documents.find(d => d.id === r.id)!;
      return h("li", null, h("strong", null, `${d.id}: ${d.title}`), ` — ${fmt(r.score, 4)}${label?.relevant.includes(d.id) ? " · labeled relevant" : ""}`, h("p", null, d.text));
    })));
    if (!list.length) results.append(note("No matching results found."));
  }
  root.append(
    row(select({ label: "saved query", value: "0", options: queries.map((q, i) => ({ value: String(i), label: q.text })), onChange: v => { query = queries[Number(v)]!.text; input.value = query; draw(); } })), row(input),
    row(select({ label: "search method", value: method, options: [{ value: "bm25", label: "Words" }, { value: "lsa", label: "Vectors" }, { value: "hybrid", label: "Combined" }], onChange: v => { method = v; draw(); } }), slider({ label: "results to show", min: 1, max: 15, step: 1, value: cutoff, onInput: v => { cutoff = v; draw(); } })),
    row(slider({ label: "repeat-word weight", min: 0, max: 3, step: 0.1, value: k1, onInput: v => { k1 = v; draw(); } }), slider({ label: "length correction", min: 0, max: 1, step: 0.05, value: b, onInput: v => { b = v; draw(); } }), slider({ label: "vector dimensions", min: 1, max: 16, step: 1, value: dimensions, onInput: v => { dimensions = v; draw(); } }), slider({ label: "rank offset", min: 0, max: 100, step: 5, value: fusionK, onInput: v => { fusionK = v; draw(); } })),
    row(recall), row(mrr), row(individual), results,
    note("Answer labels mark passages that contain needed evidence."),
  );
  draw();
}

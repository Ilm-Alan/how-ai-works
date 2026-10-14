import { cols, fmt, h, note, readout, row, select, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { documents } from "./corpus";
import { candidateProbability, candidates, estimate, jaccard, shingles, signatures } from "./minhash";

export function mount(root: HTMLElement) {
  let size = 3, hashes = 128, requestedBands = 16, rows = 4, selected = "0:1";
  const view = h("div"), scatterView = h("div"), list = h("div"), excerpts = h("div");
  const curve = chart(view, { x: [0, 1], y: [0, 1], height: 260, xLabel: "true shared-group fraction", yLabel: "chance of being checked" });
  const scatter = chart(scatterView, { x: [0, 1], y: [0, 1], height: 260, xLabel: "true shared-group fraction", yLabel: "fingerprint estimate" });
  const exact = readout("true shared-group fraction"), approx = readout("estimate"), hit = readout("pair needs checking"), count = readout("candidate pairs"), used = readout("bands × rows used");
  const pairs: [number, number][] = [];
  for (let i = 0; i < documents.length; i++) for (let j = i + 1; j < documents.length; j++) pairs.push([i, j]);
  function draw() {
    const sets = documents.map(d => shingles(d, size));
    const sigs = signatures(sets, hashes);
    const bands = Math.min(requestedBands, Math.floor(hashes / rows));
    const found = candidates(sigs, bands, rows);
    const keys = new Set(found.map(([i, j]) => `${i}:${j}`));
    const [a, b] = selected.split(":").map(Number) as [number, number];
    exact.set(fmt(jaccard(sets[a]!, sets[b]!)));
    approx.set(fmt(estimate(sigs[a]!, sigs[b]!)));
    hit.set(keys.has(selected) ? "yes" : "no");
    count.set(`${found.length} / ${pairs.length}`);
    used.set(`${bands} × ${rows} = ${bands * rows} of ${hashes} hashes`);
    excerpts.replaceChildren(h("p", null, `Document ${a + 1}: ${documents[a]}`), h("p", null, `Document ${b + 1}: ${documents[b]}`));
    curve.clear();
    const xs = Array.from({ length: 101 }, (_, i) => i / 100);
    curve.line(xs, xs.map(s => candidateProbability(s, bands, rows)), { color: curve.pal.accent });
    const s = jaccard(sets[a]!, sets[b]!);
    curve.points([s], [candidateProbability(s, bands, rows)], { color: curve.pal.fg, r: 5 });
    scatter.clear();
    scatter.line([0, 1], [0, 1], { color: scatter.pal.muted, dashed: true });
    for (const candidate of [false, true]) {
      const group = pairs.filter(([i, j]) => keys.has(`${i}:${j}`) === candidate);
      scatter.points(group.map(([i, j]) => jaccard(sets[i]!, sets[j]!)), group.map(([i, j]) => estimate(sigs[i]!, sigs[j]!)), { color: candidate ? scatter.pal.accent : scatter.pal.border, r: candidate ? 4 : 2 });
    }
    list.replaceChildren(h("h4", null, "Pairs to check (true / estimated overlap)"), ...found.map(([i, j]) => h("p", null, `${i + 1} ↔ ${j + 1}: ${fmt(jaccard(sets[i]!, sets[j]!))} / ${fmt(estimate(sigs[i]!, sigs[j]!))}`)));
  }
  root.append(row(
    slider({ label: "words per shingle", min: 1, max: 6, step: 1, value: size, onInput: v => { size = v; draw(); } }),
    slider({ label: "fingerprint entries", min: 16, max: 256, step: 16, value: hashes, onInput: v => { hashes = v; draw(); } }),
    slider({ label: "bands", min: 1, max: 32, step: 1, value: requestedBands, onInput: v => { requestedBands = v; draw(); } }),
    slider({ label: "rows per band", min: 1, max: 8, step: 1, value: rows, onInput: v => { rows = v; draw(); } }),
  ), select({ label: "compare documents", value: selected, options: pairs.map(([i, j]) => ({ value: `${i}:${j}`, label: `${i + 1} ↔ ${j + 1}` })), onChange: v => { selected = v; draw(); } }).el, row(exact, approx, hit), row(count, used), cols(view, scatterView), excerpts, list, note("Only whole bands that fit the fingerprint are used."));
  draw();
}

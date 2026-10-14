import { rng } from "../../lib/rng";
import { button, cols, fmt, h, note, readout, row, select, slider, toggle } from "../../ui/kit";
import { chart, heatmap } from "../../ui/plot";
import { attention } from "./attention";

const TOKENS = ["The", "cat", "sat", "on", "the", "mat"];
const MAX_D = 64;

export function mount(root: HTMLElement) {
  let seed = 12;
  let d = 4;
  let query = 2;
  let causal = true;
  let scaling = true;
  let temperature = 1;
  let q = new Float64Array(TOKENS.length * MAX_D);
  let k = new Float64Array(q.length);
  let v = new Float64Array(TOKENS.length * 2);
  const weightsView = h("div", null, h("h4", null, "Mix shares: rows ask, columns supply"));
  const mixView = h("div", null, h("h4", null, "Values and their mix"));
  const map = heatmap(weightsView, { cell: 40, showValues: true });
  const plot = chart(mixView, { height: 280, x: [-3, 3], y: [-3, 3], xLabel: "value dimension 1", yLabel: "value dimension 2", equalAspect: true });
  const table = h("table");
  const output = readout("Selected output");
  const entropy = readout("Mix spread (nats)");
  const peak = readout("Largest share");
  const qReadout = readout("Query (first four numbers)");

  function sample() {
    const r = rng(seed);
    for (let i = 0; i < q.length; i++) { q[i] = r.normal(); k[i] = r.normal(); }
    for (let i = 0; i < v.length; i++) v[i] = r.next() * 4 - 2;
  }

  function draw() {
    const packedQ = new Float64Array(TOKENS.length * d);
    const packedK = new Float64Array(packedQ.length);
    for (let i = 0; i < TOKENS.length; i++) {
      packedQ.set(q.subarray(i * MAX_D, i * MAX_D + d), i * d);
      packedK.set(k.subarray(i * MAX_D, i * MAX_D + d), i * d);
    }
    const a = attention(packedQ, packedK, v, TOKENS.length, d, 2, { causal, scale: scaling, temperature });
    const weights = a.weights.subarray(query * TOKENS.length, (query + 1) * TOKENS.length);
    map.update(a.weights, TOKENS.length, TOKENS.length, { range: [0, 1], rowLabels: TOKENS, colLabels: TOKENS });
    plot.clear();
    for (let j = 0; j < TOKENS.length; j++) {
      plot.points([v[2 * j]!], [v[2 * j + 1]!], { color: plot.pal.series[j], r: 3 + 7 * weights[j]! });
      plot.text(v[2 * j]!, v[2 * j + 1]! + 0.18, `${j}: ${TOKENS[j]}`, { size: 10 });
    }
    const ox = a.output[query * 2]!;
    const oy = a.output[query * 2 + 1]!;
    plot.arrow(0, 0, ox, oy, { color: plot.pal.fg, width: 2 });
    plot.legend([{ label: "output mixture", color: plot.pal.fg }]);
    table.replaceChildren(
      h("thead", null, h("tr", null, ...["Key", "Score after blocking", "Share", "Value"].map((s) => h("th", null, s)))),
      h("tbody", null, ...TOKENS.map((token, j) => h("tr", null,
        h("td", null, `${j}: ${token}`), h("td", null, fmt(a.scores[query * TOKENS.length + j]!)),
        h("td", null, fmt(weights[j]!, 4)), h("td", null, `[${fmt(v[j * 2]!)}, ${fmt(v[j * 2 + 1]!)}]`),
      ))),
    );
    output.set(`[${fmt(ox, 4)}, ${fmt(oy, 4)}]`);
    entropy.set(fmt(-weights.reduce((s, p) => s + (p > 0 ? p * Math.log(p) : 0), 0), 4));
    peak.set(fmt(Math.max(...weights), 4));
    qReadout.set(`[${Array.from(packedQ.subarray(query * d, query * d + Math.min(d, 4)), (x) => fmt(x, 2)).join(", ")}${d > 4 ? ", …" : ""}]`);
  }

  root.append(
    note("The lab uses random queries and keys, with two-number values."),
    row(
      select({ label: "query position", value: String(query), options: TOKENS.map((t, i) => ({ value: String(i), label: `${i}: ${t}` })), onChange: (x) => { query = Number(x); draw(); } }),
      select({ label: "query/key width", value: String(d), options: [2, 4, 16, 64].map((x) => ({ value: String(x), label: String(x) })), onChange: (x) => { d = Number(x); draw(); } }),
      toggle({ label: "block future tokens", value: causal, onChange: (x) => { causal = x; draw(); } }),
      toggle({ label: "divide by √d", value: scaling, onChange: (x) => { scaling = x; draw(); } }),
      slider({ label: "score temperature", min: 0.1, max: 3, step: 0.1, value: temperature, onInput: (x) => { temperature = x; draw(); } }),
      button("new vectors", () => { seed++; sample(); draw(); }),
      button("reset vectors", () => { seed = 12; sample(); draw(); }),
    ),
    row(output, entropy, peak), qReadout.el, cols(weightsView, mixView), table,
    note("Each value contributes its share to the output."),
  );
  sample();
  draw();
}

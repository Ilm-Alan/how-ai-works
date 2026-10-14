import { cols, fmt, h, note, readout, row, select, slider, toggle } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { dot, LLAMA3_8B, parameterCount, rope, type Config } from "./transformer";

export function mount(root: HTMLElement) {
  const dim = 8;
  let m = 7;
  let n = 2;
  let shift = 0;
  let logBase = 4;
  let pair = 0;
  let qAngle = 0;
  let kAngle = 0.6;
  const rotationView = h("div");
  const distanceView = h("div");
  const rotation = chart(rotationView, { height: 260, x: [-1.3, 1.3], y: [-1.3, 1.3], equalAspect: true, xLabel: "pair coordinate 1", yLabel: "pair coordinate 2" });
  const distance = chart(distanceView, { height: 260, x: [-128, 128], y: [-4.2, 4.2], xLabel: "position gap", yLabel: "dot product" });
  const score = readout("dot product after shift");
  const unshifted = readout("dot product before shift");
  const offset = readout("position gap");
  const frequency = readout("turn per token (radians)");
  const period = readout("tokens per full turn");
  const offsets = Array.from({ length: 513 }, (_, i) => -128 + i / 2);

  function drawRope() {
    const base = 10 ** logBase;
    const q = new Float64Array(dim);
    const k = new Float64Array(dim);
    for (let i = 0; i < dim / 2; i++) {
      q[2 * i] = Math.cos(qAngle); q[2 * i + 1] = Math.sin(qAngle);
      k[2 * i] = Math.cos(kAngle); k[2 * i + 1] = Math.sin(kAngle);
    }
    const qm = rope(q, m + shift, base);
    const kn = rope(k, n + shift, base);
    rotation.clear();
    rotation.arrow(0, 0, qm[2 * pair]!, qm[2 * pair + 1]!, { color: rotation.pal.accent, width: 2 });
    rotation.arrow(0, 0, kn[2 * pair]!, kn[2 * pair + 1]!, { color: rotation.pal.series[1], width: 2 });
    rotation.legend([{ label: "rotated query", color: rotation.pal.accent }, { label: "rotated key", color: rotation.pal.series[1]! }]);
    const sums = new Float64Array(offsets.length);
    const pairs = Array.from({ length: dim / 2 }, () => new Float64Array(offsets.length));
    for (let t = 0; t < offsets.length; t++) {
      const qr = rope(q, offsets[t]!, base);
      for (let i = 0; i < dim / 2; i++) {
        const contribution = qr[2 * i]! * k[2 * i]! + qr[2 * i + 1]! * k[2 * i + 1]!;
        pairs[i]![t] = contribution;
        sums[t]! += contribution;
      }
    }
    distance.clear();
    for (let i = 0; i < pairs.length; i++) distance.line(offsets, pairs[i]!, { color: distance.pal.series[i], width: i === pair ? 2 : 1, dashed: i !== pair });
    distance.line(offsets, sums, { color: distance.pal.fg, width: 2 });
    distance.points([m - n], [dot(qm, kn)], { color: distance.pal.accent, r: 5 });
    distance.legend([...pairs.map((_, i) => ({ label: `pair ${i}`, color: distance.pal.series[i]! })), { label: "sum", color: distance.pal.fg }]);
    score.set(fmt(dot(qm, kn), 6));
    unshifted.set(fmt(dot(rope(q, m, base), rope(k, n, base)), 6));
    offset.set(m - n);
    const theta = base ** (-2 * pair / dim);
    frequency.set(fmt(theta, 6));
    period.set(fmt(2 * Math.PI / theta, 2));
  }

  const c: Config = { ...LLAMA3_8B };
  let ratio = c.mlpWidth / c.width;
  let kvFraction = c.kvHeads / c.heads;
  const total = readout("Total weights");
  const headWidth = readout("Values per head");
  const mlpWidth = readout("Inner network width");
  const kvHeads = readout("Key/value heads");
  const breakdown = h("table");
  function drawCount() {
    c.mlpWidth = Math.round(c.width * ratio);
    c.kvHeads = kvFraction === 0 ? 1 : c.heads * kvFraction;
    const p = parameterCount(c);
    total.set(`${fmt(p.total / 1e9, 6)}B (${p.total.toLocaleString("en-US")})`);
    headWidth.set(p.headDim);
    mlpWidth.set(c.mlpWidth);
    kvHeads.set(c.kvHeads);
    breakdown.replaceChildren(
      h("thead", null, h("tr", null, h("th", null, "Component"), h("th", null, "Weights"), h("th", null, "% of total"))),
      h("tbody", null, ...([ ["Input + output tables", p.embeddings], ["Attention matrices", p.attention], ["Inner network matrices", p.mlp], ["Rescaling weights", p.norms] ] as const).map(([label, count]) => h("tr", null, h("td", null, label), h("td", null, count.toLocaleString("en-US")), h("td", null, fmt(100 * count / p.total, 2))))),
    );
  }

  root.append(
    h("h4", null, "Position: four rotating pairs"),
    row(
      slider({ label: "query position", min: -64, max: 64, step: 1, value: m, onInput: (x) => { m = x; drawRope(); } }),
      slider({ label: "key position", min: -64, max: 64, step: 1, value: n, onInput: (x) => { n = x; drawRope(); } }),
      slider({ label: "common position shift", min: -100, max: 100, step: 1, value: shift, onInput: (x) => { shift = x; drawRope(); } }),
      slider({ label: "RoPE base (log₁₀)", min: 1, max: 6, step: 0.25, value: logBase, format: (x) => fmt(10 ** x, 0), onInput: (x) => { logBase = x; drawRope(); } }),
      select({ label: "pair to inspect", options: [0, 1, 2, 3].map((i) => ({ value: String(i), label: String(i) })), value: "0", onChange: (x) => { pair = Number(x); drawRope(); } }),
      slider({ label: "query angle (radians)", min: -3.14, max: 3.14, step: 0.02, value: qAngle, onInput: (x) => { qAngle = x; drawRope(); } }),
      slider({ label: "key angle (radians)", min: -3.14, max: 3.14, step: 0.02, value: kAngle, onInput: (x) => { kAngle = x; drawRope(); } }),
    ),
    row(score, unshifted, offset, frequency, period), cols(rotationView, distanceView),
    note("Pair contributions can cancel, then recover as the gap grows."),
    h("h4", null, "Count weights (starts with Llama 3 8B)"),
    row(
      select({ label: "model width", value: String(c.width), options: [256, 512, 1024, 2048, 4096, 8192].map((x) => ({ value: String(x), label: String(x) })), onChange: (x) => { c.width = Number(x); drawCount(); } }),
      slider({ label: "layers", min: 1, max: 96, step: 1, value: c.layers, onInput: (x) => { c.layers = x; drawCount(); } }),
      select({ label: "query heads", value: String(c.heads), options: [8, 16, 32, 64].map((x) => ({ value: String(x), label: String(x) })), onChange: (x) => { c.heads = Number(x); drawCount(); } }),
      select({ label: "key/value heads", value: "0.25", options: [{ value: "1", label: "All query heads" }, { value: "0.5", label: "Half" }, { value: "0.25", label: "Quarter" }, { value: "0", label: "One" }], onChange: (x) => { kvFraction = Number(x); drawCount(); } }),
      slider({ label: "vocabulary size", min: 256, max: 256256, step: 1000, value: c.vocab, onInput: (x) => { c.vocab = x; drawCount(); } }),
      slider({ label: "inner width / model width", min: 1, max: 6, step: 0.25, value: ratio, onInput: (x) => { ratio = x; drawCount(); } }),
      select({ label: "inner network", value: c.mlp, options: [{ value: "swiglu", label: "Gated: 3 matrices" }, { value: "classic", label: "Classic: 2 matrices" }], onChange: (x) => { c.mlp = x; drawCount(); } }),
      toggle({ label: "tie embedding and output weights", value: c.tied, onChange: (x) => { c.tied = x; drawCount(); } }),
    ),
    row(total, headWidth, mlpWidth, kvHeads), breakdown,
    note("Tying saves one input table's worth of weights."),
  );
  drawRope();
  drawCount();
}

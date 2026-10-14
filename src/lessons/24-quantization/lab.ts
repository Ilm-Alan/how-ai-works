import { rng } from "../../lib/rng";
import { fmt, h, note, readout, row, select, toggle } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { errorStats, type Format, FORMATS, type Granularity, quantize } from "./quant";

const ROWS = 64;
const COLS = 256;
const SIGMA = 0.02;
const SHOWN = 2500;

export function mount(root: HTMLElement) {
  let format: Format = "int4";
  let gran: Granularity = "tensor";
  let outliers = true;

  const base = rng(1);
  const clean = Float32Array.from({ length: ROWS * COLS }, () => SIGMA * base.normal());
  const withOutliers = Float32Array.from(clean);
  // A handful of weights ~20σ out, as seen in real LLM weight matrices.
  for (let k = 0; k < 8; k++) withOutliers[base.int(withOutliers.length)] = (base.next() < 0.5 ? -1 : 1) * (0.3 + 0.2 * base.next());
  const pick = Array.from({ length: SHOWN }, () => base.int(ROWS * COLS));

  const view = h("div");
  const c = chart(view, { height: 320, x: [-0.08, 0.08], y: [-0.08, 0.08], xLabel: "original weight", yLabel: "after quantization", equalAspect: true });
  const bits = readout("bits per weight");
  const mem = readout("70B-parameter model");
  const rel = readout("relative error");
  const sqnr = readout("signal compared with error");
  const zero = readout("weights rounded to 0");
  const granSel = select<string>({
    label: "one scale per",
    options: [
      { value: "tensor", label: "whole tensor" },
      { value: "row", label: `row (${COLS} weights)` },
      { value: "128", label: "block of 128" },
      { value: "32", label: "block of 32" },
      { value: "16", label: "block of 16" },
    ],
    value: "tensor",
    onChange: (v) => {
      gran = v === "tensor" || v === "row" ? v : (Number(v) as Granularity);
      draw();
    },
  });

  function draw() {
    const w = outliers ? withOutliers : clean;
    const fixed = format === "mxfp4" || format === "nvfp4";
    granSel.el.querySelector("select")!.disabled = fixed;
    const { deq, bitsPerWeight } = quantize(w, COLS, format, gran);
    const s = errorStats(w, deq);
    bits.set(fmt(bitsPerWeight, 3));
    mem.set(`${fmt((70e9 * bitsPerWeight) / 8 / 1e9, 3)} GB (BF16: 140 GB)`);
    rel.set(`${fmt(s.relRmse * 100, 2)}%`);
    sqnr.set(`${fmt(s.sqnrDb, 3)} dB`);
    zero.set(`${fmt(s.zeroed * 100, 1)}%`);
    c.clear();
    c.line([-0.08, 0.08], [-0.08, 0.08], { color: c.pal.muted, dashed: true, width: 1 });
    c.points(
      pick.map((i) => w[i]!),
      pick.map((i) => deq[i]!),
      { color: c.pal.accent, r: 1.8 },
    );
  }

  root.append(
    row(
      select({
        label: "format",
        options: (Object.keys(FORMATS) as Format[]).map((f) => ({ value: f, label: FORMATS[f].label })),
        value: format,
        onChange: (v) => ((format = v), draw()),
      }),
      granSel,
      toggle({ label: "8 outlier weights", value: outliers, onChange: (v) => ((outliers = v), draw()) }),
    ),
    row(bits, mem),
    row(rel, sqnr, zero),
    view,
    note(`Each dot is one weight; dots on the dashed line are unchanged.`),
  );
  draw();
}

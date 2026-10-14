import { rng } from "../../lib/rng";
import { button, cols, fmt, h, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { ci95, confusion, roc, summarize } from "./metrics";

const BINS = 40;
const LO = -4;
const HI = 6;

export function mount(root: HTMLElement) {
  let seed = 1;
  let sep = 1.5;
  let logPrev = -1;
  let logN = 3;
  let thr = 0.75;
  let scores = new Float64Array(0);
  let labels = new Uint8Array(0);
  let curve = { fpr: [0], tpr: [0], auc: 0.5 };

  // Negatives score ~ N(0, 1), positives ~ N(sep, 1).
  function sample() {
    const r = rng(seed);
    const n = Math.round(10 ** logN);
    const prev = 10 ** logPrev;
    scores = new Float64Array(n);
    labels = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      labels[i] = r.next() < prev ? 1 : 0;
      scores[i] = r.normal() + (labels[i] ? sep : 0);
    }
    curve = roc(scores, labels);
  }

  const histView = h("div");
  const rocView = h("div");
  const hist = chart(histView, { height: 260, x: [LO, HI], y: [0, 0.5], xLabel: "score", yLabel: "share of class" });
  const rocChart = chart(rocView, { height: 260, x: [0, 1], y: [0, 1], xLabel: "false alarm rate", yLabel: "recall", equalAspect: true });
  const acc = readout("accuracy");
  const base = readout("always-negative baseline");
  const prec = readout("precision");
  const rec = readout("recall");
  const f1 = readout("F1");
  const fpr = readout("false alarm rate");
  const auc = readout("ranking score (AUC)");
  const counts = readout("caught / false alarms / missed / ruled out");

  function draw() {
    const c = confusion(scores, labels, thr);
    const s = summarize(c);
    const pos = c.tp + c.fn;
    acc.set(`${fmt(s.accuracy * 100, 1)}% ± ${fmt(ci95(s.accuracy, s.n) * 100, 1)}`);
    base.set(`${fmt(((s.n - pos) / s.n) * 100, 1)}%`);
    prec.set(Number.isNaN(s.precision) ? "n/a" : fmt(s.precision, 3));
    rec.set(Number.isNaN(s.recall) ? "n/a" : fmt(s.recall, 3));
    f1.set(Number.isNaN(s.f1) ? "n/a" : fmt(s.f1, 3));
    fpr.set(fmt(s.fpr, 3));
    auc.set(fmt(curve.auc, 3));
    counts.set(`${c.tp} / ${c.fp} / ${c.fn} / ${c.tn}`);

    const w = (HI - LO) / BINS;
    const hp = new Float64Array(BINS);
    const hn = new Float64Array(BINS);
    for (let i = 0; i < scores.length; i++) {
      const b = Math.floor((scores[i]! - LO) / w);
      if (b < 0 || b >= BINS) continue;
      if (labels[i]) hp[b]!++;
      else hn[b]!++;
    }
    const neg = s.n - pos;
    const xs = Array.from({ length: BINS }, (_, b) => LO + (b + 0.5) * w);
    hist.clear();
    hist.line(xs, Array.from(hn, (v) => v / Math.max(1, neg)), { color: hist.pal.series[0] });
    hist.line(xs, Array.from(hp, (v) => v / Math.max(1, pos)), { color: hist.pal.series[1] });
    hist.line([thr, thr], [0, 0.5], { color: hist.pal.fg, width: 1.5, dashed: true });
    hist.legend([
      { label: `negatives (${neg})`, color: hist.pal.series[0]! },
      { label: `positives (${pos})`, color: hist.pal.series[1]! },
    ]);

    rocChart.clear();
    rocChart.line([0, 1], [0, 1], { color: rocChart.pal.muted, dashed: true, width: 1 });
    rocChart.line(curve.fpr, curve.tpr, { color: rocChart.pal.accent });
    if (!Number.isNaN(s.fpr) && !Number.isNaN(s.recall)) rocChart.points([s.fpr], [s.recall], { color: rocChart.pal.series[1], r: 5 });
  }

  const resample = () => {
    sample();
    draw();
  };

  root.append(
    row(
      slider({ label: "score gap", min: 0, max: 4, step: 0.1, value: sep, onInput: (v) => ((sep = v), resample()) }),
      slider({ label: "positive rate", min: -2, max: Math.log10(0.5), step: 0.05, value: logPrev, format: (v) => `${fmt(10 ** v * 100, 2)}%`, onInput: (v) => ((logPrev = v), resample()) }),
      slider({ label: "test set size", min: 1.7, max: 5, step: 0.1, value: logN, format: (v) => String(Math.round(10 ** v)), onInput: (v) => ((logN = v), resample()) }),
      slider({ label: "threshold", min: LO, max: HI, step: 0.05, value: thr, onInput: (v) => ((thr = v), draw()) }),
      button("New sample", () => ((seed += 1), resample())),
    ),
    row(acc, base, auc),
    row(prec, rec, f1, fpr),
    row(counts),
    cols(histView, rocView),
  );
  resample();
}

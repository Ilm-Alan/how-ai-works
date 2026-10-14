import { button, fmt, h, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { decodeBound, expectedTokens, simulate, speculativeSpeedup } from "./inference";

export function mount(root: HTMLElement) {
  let alpha = 0.8, k = 4, draftCost = 0.1, verifyCost = 1, seed = 17;
  let bandwidthTB = 2, modelGB = 16, batch = 1, kvGB = 0;
  const exact = readout("average tokens per check");
  const sampled = readout("trial mean ± uncertainty");
  const speed = readout("speedup");
  const best = readout("best draft length");
  const aggregate = readout("total token speed limit");
  const perRequest = readout("one answer's speed limit");
  const delay = readout("time between tokens");
  const view = h("div");
  const c = chart(view, { height: 270, x: [0, 16], y: [0, 5], xLabel: "draft tokens", yLabel: "speedup over plain decoding" });
  const histogramView = h("div");
  const histogram = chart(histogramView, { height: 220, x: [0.5, 5.5], y: [0, 1], xLabel: "tokens from one check", yLabel: "chance" });
  const lengths = Array.from({ length: 17 }, (_, i) => i);

  function draw() {
    const s = simulate(alpha, k, 20000, seed);
    exact.set(fmt(expectedTokens(alpha, k), 4));
    sampled.set(`${fmt(s.mean, 4)} ± ${fmt(2 * s.standardError, 4)} (20,000 trials)`);
    const speeds = lengths.map((n) => n === 0 ? 1 : speculativeSpeedup(alpha, n, draftCost, verifyCost));
    const chosenSpeed = k === 0 ? 1 : speculativeSpeedup(alpha, k, draftCost, verifyCost);
    speed.set(`${fmt(chosenSpeed, 3)}×${chosenSpeed < 1 ? " (slower)" : ""}`);
    const bestK = speeds.indexOf(Math.max(...speeds));
    best.set(`${bestK}, ${fmt(speeds[bestK]!, 3)}×`);
    c.y = [0, Math.max(1.2, ...speeds) * 1.12];
    c.clear();
    c.line(lengths, speeds, { color: c.pal.accent });
    c.line([0, 16], [1, 1], { color: c.pal.muted, dashed: true });
    c.points([k], [chosenSpeed], { color: c.pal.fg, r: 5 });
    const tokens = Array.from({ length: k + 1 }, (_, i) => i + 1);
    const probabilities = tokens.map((n) => n === k + 1 ? alpha ** k : alpha ** (n - 1) * (1 - alpha));
    histogram.x = [0.5, k + 1.5];
    histogram.clear();
    tokens.forEach((n, i) => histogram.line([n, n], [0, probabilities[i]!], { color: histogram.pal.accent, width: 6 }));
    histogram.points(tokens, tokens.map((n) => s.histogram[n]! / 20000), { color: histogram.pal.series[1], r: 4 });
    histogram.legend([{ label: "formula", color: histogram.pal.accent }, { label: "trials", color: histogram.pal.series[1]! }]);
    const b = decodeBound(bandwidthTB * 1e12, modelGB * 1e9, batch, kvGB * 1e9);
    aggregate.set(`${fmt(b.aggregate, 1)} tokens/s`);
    perRequest.set(`${fmt(b.perSequence, 1)} tokens/s`);
    delay.set(`${fmt(b.stepSeconds * 1000, 2)} ms`);
  }

  root.append(row(
    slider({ label: "chance a draft token passes", min: 0, max: 1, step: 0.01, value: alpha, onInput: (v) => { alpha = v; draw(); } }),
    slider({ label: "draft tokens", min: 0, max: 16, step: 1, value: k, onInput: (v) => { k = v; draw(); } }),
    slider({ label: "draft token cost", min: 0, max: 0.5, step: 0.01, value: draftCost, onInput: (v) => { draftCost = v; draw(); } }),
    slider({ label: "check cost", min: 1, max: 3, step: 0.1, value: verifyCost, onInput: (v) => { verifyCost = v; draw(); } }),
    button("New trials", () => { seed++; draw(); }), button("Reset trials", () => { seed = 17; draw(); })),
    row(exact, sampled, speed, best), view, histogramView,
    note("Costs are relative to one plain decode step."),
    h("h3", null, "Decode speed limit from memory bandwidth"), row(
      slider({ label: "memory bandwidth (TB/s)", min: 0.5, max: 8, step: 0.1, value: bandwidthTB, onInput: (v) => { bandwidthTB = v; draw(); } }),
      slider({ label: "weights (GB)", min: 1, max: 160, step: 1, value: modelGB, onInput: (v) => { modelGB = v; draw(); } }),
      slider({ label: "batch size", min: 1, max: 64, step: 1, value: batch, onInput: (v) => { batch = v; draw(); } }),
      slider({ label: "cache read per answer (GB)", min: 0, max: 8, step: 0.1, value: kvGB, onInput: (v) => { kvGB = v; draw(); } })),
    row(aggregate, perRequest, delay), note("Each batch reads the weights once, plus each answer's cache."));
  draw();
}

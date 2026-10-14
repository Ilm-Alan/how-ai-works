import { button, fmt, h, loop, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { bootstrapBT, fitBT, simulateVotes, strengths } from "./bt";

export function mount(root: HTMLElement) {
  let count = 150, seed = 1, bias = 0;
  const view = h("div");
  const c = chart(view, { height: 300, x: [-0.5, 5.5], y: [-3, 3], xLabel: "model (0–5)", yLabel: "relative strength" });
  const flips = readout("pairs in the wrong order");
  const status = readout("resampling votes");
  const table = h("div");
  let votes = simulateVotes(count, seed, bias);
  let fit = fitBT(6, votes);
  let samples: number[][] = Array.from({ length: 6 }, () => []);
  let completed = 0;
  const runner = loop(root, () => {
    const replicate = bootstrapBT(6, votes, seed + 1000 + completed, 1);
    replicate.forEach(([v], i) => samples[i]!.push(v));
    completed++;
    status.set(`${completed} / 100 resamples`);
    if (completed < 100) return true;
    const intervals = samples.map(values => {
      values.sort((a, b) => a - b);
      return [values[2]!, values[97]!] as [number, number];
    });
    c.clear();
    intervals.forEach(([lo, hi], i) => c.line([i, i], [lo, hi], { color: c.pal.accent, width: 3 }));
    c.points([0, 1, 2, 3, 4, 5], strengths, { color: c.pal.muted, r: 5 });
    c.points([0, 1, 2, 3, 4, 5], fit, { color: c.pal.accent, r: 4 });
    c.legend([{ label: "true strength", color: c.pal.muted }, { label: "fit and 95% range", color: c.pal.accent }]);
    let inversions = 0;
    for (let i = 0; i < 6; i++) for (let j = i + 1; j < 6; j++) if (fit[i]! > fit[j]!) inversions++;
    flips.set(inversions);
    table.replaceChildren(...fit.map((v, i) => h("p", null, `Model ${i}: ${fmt(v)} [${fmt(intervals[i]![0])}, ${fmt(intervals[i]![1])}]`)));
    status.set("100 resamples complete");
    return false;
  }, 8);
  function update() {
    runner.stop();
    votes = simulateVotes(count, seed, bias);
    fit = fitBT(6, votes);
    samples = Array.from({ length: 6 }, () => []);
    completed = 0;
    c.clear();
    c.points([0, 1, 2, 3, 4, 5], strengths, { color: c.pal.muted, r: 5 });
    c.points([0, 1, 2, 3, 4, 5], fit, { color: c.pal.accent, r: 4 });
    table.replaceChildren();
    flips.set("pending"); status.set("pending"); runner.start();
  }
  root.append(row(
    slider({ label: "votes", min: 30, max: 3000, step: 30, value: count, onInput: v => { count = v; update(); } }),
    slider({ label: "first-answer bias", min: 0, max: 2, step: 0.1, value: bias, onInput: v => { bias = v; update(); } }),
    button("New votes", () => { seed++; update(); }),
    button("Reset", () => { seed = 1; update(); }),
  ), row(flips, status), view, table, note("More votes reduce noise, but do not remove a bias in how people vote."));
  update();
  return () => runner.stop();
}

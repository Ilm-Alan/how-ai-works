import { button, cols, fmt, h, loop, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { DEFAULT_LR, Run, STEPS, type Schedule } from "./training";

export function mount(root: HTMLElement) {
  let peak = DEFAULT_LR;
  let runs: Run[] = [];
  let branch: Run | undefined;
  const lossView = h("div"), lrView = h("div");
  const lossChart = chart(lossView, { x: [0, STEPS + 80], y: [1e-5, 10], logY: true, height: 300, xLabel: "updates", yLabel: "mean squared error" });
  const lrChart = chart(lrView, { x: [0, STEPS + 80], y: [0, peak], height: 300, xLabel: "updates", yLabel: "learning rate" });
  const status = readout("run status"), branchStatus = readout("decay branch");
  const errors = [readout("constant error"), readout("cosine error"), readout("late decay error")];
  const names = ["constant", "cosine", "warmup-stable-decay", "branched decay"];
  function draw() {
    lossChart.clear(); lrChart.y = [0, peak * 1.05]; lrChart.clear();
    const all = branch ? [...runs, branch] : runs;
    all.forEach((run, i) => {
      const color = lossChart.pal.series[i]!;
      const finite = run.history.filter(p => Number.isFinite(p.loss));
      lossChart.line(finite.map(p => p.step), finite.map(p => Math.max(1e-5, p.loss)), { color, dashed: i === 3 });
      lrChart.line(run.history.map(p => p.step), run.history.map(p => p.lr), { color, dashed: i === 3 });
      if (i < 3) errors[i]!.set(run.diverged ? `diverged at ${run.step}` : fmt(run.history.at(-1)!.loss, 5));
    });
    const legend = all.map((_, i) => ({ label: names[i]!, color: lossChart.pal.series[i]! }));
    lossChart.legend(legend); lrChart.legend(legend);
    status.set(`step ${runs[0]?.step ?? 0}; ${runner.running ? "running" : "paused / finished"}`);
    branchStatus.set(branch ? `decay begins at ${branch.decayStart}; error ${fmt(branch.history.at(-1)!.loss, 5)}${branch.diverged ? " (diverged)" : ""}` : "none; pause and branch the constant run");
  }
  const runner = loop(root, () => {
    let active = false;
    for (const run of runs) active = run.tick() || active;
    if (branch) active = branch.tick() || active;
    if (!active) runner.stop();
    draw();
    return active;
  }, 8);
  function reset() {
    runner.stop();
    runs = (["constant", "cosine", "wsd"] as Schedule[]).map(kind => new Run(kind, peak));
    branch = undefined; draw();
  }
  root.append(row(
    slider({ label: "peak learning rate", min: -2, max: 0.5, step: 0.05, value: Math.log10(peak), map: v => 10 ** v, onInput: v => { peak = v; reset(); } }),
    button("start", () => { runner.start(); draw(); }, "primary"),
    button("pause", () => { runner.stop(); draw(); }),
    button("reset", reset),
    button("branch decay now", () => { runner.stop(); branch = runs[0]!.branch(); draw(); }),
  ), row(status, branchStatus), row(...errors), cols(lossView, lrView), note("Warmup takes 20 updates; late decay takes the last 80."));
  reset();
  return () => runner.stop();
}

import { rng } from "../../lib/rng";
import { button, cols, fmt, h, loop, note, readout, row, select, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { candidates, initialLogits, metrics, step } from "./policy";
export function mount(root: HTMLElement) {
  let beta = 0; let mode: "exact" | "grpo" = "exact"; let groupSize = 16;
  let z = initialLogits(); let random = rng(7); let ticks = 0;
  const history: { proxy: number; truth: number; kl: number }[] = [];
  const rewardView = h("div"); const klView = h("div");
  const rewards = chart(rewardView, { x: [0, 3000], y: [0, 1.4], xLabel: "steps", yLabel: "average score" });
  const divergence = chart(klView, { x: [0, 3000], y: [0, 5], xLabel: "steps", yLabel: "distance from start" });
  const proxy = readout("reward score"); const truth = readout("true quality"); const kl = readout("distance from start"); const probs = h("div");
  function draw() {
    const m = metrics(z); proxy.set(fmt(m.proxy)); truth.set(fmt(m.truth)); kl.set(fmt(m.kl));
    const xs = history.map((_, i) => i * 10);
    rewards.clear(); rewards.line(xs, history.map(x => x.proxy), { color: rewards.pal.accent }); rewards.line(xs, history.map(x => x.truth), { color: rewards.pal.series[1] }); rewards.legend([{ label: "reward score", color: rewards.pal.accent }, { label: "true quality", color: rewards.pal.series[1]! }]);
    divergence.clear(); divergence.line(xs, history.map(x => x.kl));
    probs.replaceChildren(...candidates.map((c, i) => h("p", null, `${c.label}: ${(100 * m.p[i]!).toFixed(1)}% · score ${c.proxy} · quality ${c.truth}`)));
  }
  function advance() { if (ticks >= 3000) return false; z = step(z, beta, 0.25, mode === "grpo" ? random : undefined, groupSize); ticks++; if (ticks % 10 === 0) { history.push(metrics(z)); draw(); } return true; }
  const runner = loop(root, advance, 5);
  function reset() { runner.stop(); z = initialLogits(); random = rng(7); ticks = 0; history.length = 0; history.push(metrics(z)); draw(); }
  root.append(row(select({ label: "update", value: mode, options: [{ value: "exact", label: "full update" }, { value: "grpo", label: "sampled group" }], onChange: v => { mode = v; reset(); } }), slider({ label: "change penalty", min: 0, max: 5, step: 0.05, value: beta, onInput: v => { beta = v; reset(); } }), slider({ label: "answers per group", min: 2, max: 64, step: 2, value: groupSize, onInput: v => { groupSize = v; reset(); } })), row(button("Start", () => runner.start(), "primary"), button("Pause", () => runner.stop()), button("Step ×10", () => { runner.stop(); for (let i = 0; i < 10; i++) advance(); }), button("Reset", reset)), row(proxy, truth, kl), cols(rewardView, klView), probs,
    note("Training follows the reward score, not true quality."));
  reset(); return () => runner.stop();
}

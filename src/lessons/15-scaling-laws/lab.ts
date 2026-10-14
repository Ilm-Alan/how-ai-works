import { fmt, h, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { allocation, loss, optimal } from "./scaling";

export function mount(root: HTMLElement) {
  let logCompute = 22, size = 1;
  const view = h("div");
  const c = chart(view, { height: 310, x: [-1.3, 1.3], y: [1.8, 4], xLabel: "log₁₀(size / best size)", yLabel: "predicted loss" });
  const optSize = readout("best weights / tokens");
  const optRatio = readout("best tokens per weight");
  const chosen = readout("chosen weights / tokens");
  const l = readout("loss / added loss");
  const serving = readout("operations per output token");
  const xs = Array.from({ length: 121 }, (_, i) => -1.3 + i * 2.6 / 120);
  function draw() {
    const budget = 10 ** logCompute;
    const o = optimal(budget), a = allocation(budget, size);
    const oLoss = loss(o.parameters, o.tokens);
    const curves = [budget / 10, budget, budget * 10].map((b) => xs.map((x) => loss(o.parameters * 10 ** x, b / (6 * o.parameters * 10 ** x))));
    c.y = [Math.min(...curves.flat()) - 0.03, Math.max(...curves.flat()) + 0.05];
    c.clear();
    curves.forEach((ys, i) => c.line(xs, ys, { color: c.pal.series[i], dashed: i !== 1 }));
    c.points([0], [oLoss], { color: c.pal.accent, r: 5 });
    c.points([Math.log10(size)], [a.loss], { color: c.pal.fg, r: 5 });
    c.legend([{ label: "one tenth the budget", color: c.pal.series[0]! }, { label: "chosen budget", color: c.pal.series[1]! }, { label: "ten times the budget", color: c.pal.series[2]! }]);
    optSize.set(`${fmt(o.parameters / 1e9, 2)}B / ${fmt(o.tokens / 1e9, 1)}B tokens`);
    optRatio.set(fmt(o.tokens / o.parameters, 2));
    chosen.set(`${fmt(a.parameters / 1e9, 2)}B / ${fmt(a.tokens / 1e9, 1)}B tokens`);
    l.set(`${fmt(a.loss, 4)} / +${fmt(a.loss - oLoss, 4)}`);
    serving.set(`${fmt(a.inferenceFlops / 1e9, 2)} billion (${fmt(size, 2)}× optimum)`);
  }

  root.append(
    row(slider({ label: "training budget (log₁₀ operations)", min: 20, max: 24, step: 0.1, value: logCompute, onInput: (v) => { logCompute = v; draw(); } }),
      slider({ label: "model size / best size", min: -1.3, max: 1.3, step: 0.05, value: 0, map: (v) => 10 ** v, format: (v) => `${fmt(v, 2)}×`, onInput: (v) => { size = v; draw(); } })),
    row(optSize, optRatio), row(chosen, l), row(serving), view,
    note("Each curve spends a fixed training budget."),
  );
  draw();
}

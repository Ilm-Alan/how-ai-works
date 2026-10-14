import { button, cols, fmt, h, loop, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { ToyModel } from "./toy";

export function mount(root: HTMLElement) {
  let n = 5, sparsity = 0.95, decay = 0.7;
  let model = new ToyModel(n, sparsity, decay);
  const geometry = h("div"), bars = h("div");
  const c = chart(geometry, { height: 310, x: [-1.5, 1.5], y: [-1.5, 1.5], equalAspect: true, xLabel: "hidden dimension 1", yLabel: "hidden dimension 2" });
  const b = chart(bars, { height: 310, x: [-0.5, n - 0.5], y: [0, 3], xLabel: "feature", yLabel: "arrow length / overlap" });
  const steps = readout("training steps"), loss = readout("weighted error"), represented = readout("arrows longer than 0.8");
  function draw() {
    const metrics = model.metrics();
    c.clear(); b.clear();
    for (let i = 0; i < n; i++) {
      const x = model.w.data[i]!, y = model.w.data[n + i]!;
      const color = c.pal.series[i % 6]!;
      c.arrow(0, 0, x, y, { color, width: 2 });
      c.text(x * 1.1, y * 1.1, `${i}`, { color });
      b.line([i - 0.12, i - 0.12], [0, metrics.norms[i]!], { color, width: 7 });
      b.line([i + 0.12, i + 0.12], [0, metrics.interference[i]!], { color: b.pal.muted, width: 7 });
    }
    b.legend([{ label: "arrow length", color: b.pal.accent }, { label: "overlap", color: b.pal.muted }]);
    steps.set(model.steps); loss.set(fmt(model.loss, 5)); represented.set(`${metrics.represented} / ${n}`);
  }
  const runner = loop(root, () => {
    for (let i = 0; i < 10; i++) model.step();
    draw();
    return model.steps < 6000;
  }, 8);
  function reset() { runner.stop(); model = new ToyModel(n, sparsity, decay); b.x = [-0.5, n - 0.5]; draw(); }
  root.append(row(
    slider({ label: "features", min: 3, max: 6, step: 1, value: n, onInput: v => { n = v; reset(); } }),
    slider({ label: "chance a feature is absent", min: 0, max: 0.99, step: 0.01, value: sparsity, onInput: v => { sparsity = v; reset(); } }),
    slider({ label: "importance drop", min: 0.4, max: 1, step: 0.05, value: decay, onInput: v => { decay = v; reset(); } }),
    button("Start", () => runner.start(), "primary"), button("Pause", () => runner.stop()), button("Reset", reset),
  ), row(steps, loss, represented), cols(geometry, bars), note("Features share space more easily when fewer are active at once."));
  draw();
  return () => runner.stop();
}

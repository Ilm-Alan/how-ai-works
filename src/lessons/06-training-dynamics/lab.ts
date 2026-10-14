import { button, cols, fmt, h, loop, note, readout, row, slider, toggle } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { DeepExperiment, DEPTH, defaults } from "./dynamics";

export function mount(root: HTMLElement) {
  const settings = { ...defaults };
  let model = new DeepExperiment({ ...settings });
  let current = model.measure(), steps = 0;
  let losses = [current.loss];
  const gradientsView = h("div"), lossView = h("div");
  const gradients = chart(gradientsView, { x: [0, DEPTH + 1], y: [1e-12, 1e3], logY: true, xLabel: "hidden layer", yLabel: "gradient size", height: 300 });
  const curve = chart(lossView, { x: [0, 300], y: [1e-5, 10], logY: true, xLabel: "update", yLabel: "training loss", height: 300 });
  const step = readout("updates"), loss = readout("loss"), first = readout("layer 1 gradient"), last = readout("layer 20 gradient"), state = readout("state", "paused");
  function draw() {
    gradients.clear();
    for (let i = 0; i < DEPTH; i++) {
      const v = current.norms[i]!;
      if (Number.isFinite(v)) gradients.line([i + 1, i + 1], [1e-12, Math.max(v, 1e-12)], { width: 7 });
    }
    curve.y = [1e-5, Math.max(1, ...losses.filter(Number.isFinite))];
    curve.clear(); curve.line(losses.map((_, i) => i * 5), losses);
    step.set(steps); loss.set(fmt(current.loss, 5));
    first.set(current.norms[0]!.toExponential(2)); last.set(current.norms[DEPTH - 1]!.toExponential(2));
  }
  const runner = loop(root, () => {
    current = model.measure(true); steps++;
    if (steps % 5 === 0 || steps === 300) {
      current = model.measure(); losses.push(current.loss); draw();
    }
    if (!Number.isFinite(current.loss) || !current.norms.every(Number.isFinite)) { state.set("non-finite: reset or lower scale"); draw(); return false; }
    if (steps >= 300) { state.set("finished"); return false; }
  }, 8);
  function reset() {
    runner.stop(); model = new DeepExperiment({ ...settings }); current = model.measure();
    steps = 0; losses = [current.loss]; state.set("paused"); draw();
  }
  root.append(
    row(toggle({ label: "residual connections", value: settings.residual, onChange: v => { settings.residual = v; reset(); } }),
      toggle({ label: "normalization", value: settings.norm, onChange: v => { settings.norm = v; reset(); } }),
      slider({ label: "initial weight scale", min: 0.1, max: 3, step: 0.1, value: settings.initScale, onInput: v => { settings.initScale = v; reset(); } })),
    row(button("Start", () => { if (steps < 300 && Number.isFinite(current.loss)) { state.set("training"); runner.start(); } }, "primary"), button("Pause", () => { runner.stop(); current = model.measure(); draw(); state.set("paused"); }), button("Reset", reset)),
    row(step, loss, first, last, state), cols(gradientsView, lossView),
    note("Bars show gradient size on a log scale."),
  );
  draw();
  return () => runner.stop();
}

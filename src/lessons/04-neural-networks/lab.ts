import { button, cols, fmt, h, loop, note, readout, row, select, slider } from "../../ui/kit";
import { chart, mix } from "../../ui/plot";
import { MLP, samples, type Activation, type Dataset } from "./network";

export function mount(root: HTMLElement) {
  let kind: Dataset = "xor", activation: Activation = "tanh", width = 12, depth = 2;
  let data = samples(kind), model = new MLP(width, depth, activation);
  let steps = 0;
  let losses: number[] = [];
  const fieldView = h("div"), lossView = h("div");
  const field = chart(fieldView, { x: [-1.2, 1.2], y: [-1.2, 1.2], height: 300, xLabel: "x₁", yLabel: "x₂" });
  const curve = chart(lossView, { x: [0, 800], y: [0, 1], height: 300, xLabel: "step", yLabel: "loss" });
  const step = readout("step"), loss = readout("training loss"), accuracy = readout("training accuracy"), state = readout("state", "paused");
  const size = 28;
  const grid = new Float32Array(size * size * 2);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const k = (j * size + i) * 2;
    grid[k] = -1.2 + (i + 0.5) * 2.4 / size;
    grid[k + 1] = 1.2 - (j + 0.5) * 2.4 / size;
  }
  function draw() {
    field.clear();
    const p = model.probabilities(grid);
    field.field(size, size, (i, j) => {
      const v = p[j * size + i]!;
      return mix(field.pal.series[v >= 0.5 ? 1 : 0]!, 0.12 + 0.55 * Math.abs(2 * v - 1));
    });
    const xs = [], ys = [], colors = [];
    for (let i = 0; i < data.y.length; i++) {
      xs.push(data.x.data[2 * i]!); ys.push(data.x.data[2 * i + 1]!); colors.push(field.pal.series[data.y[i]!]!);
    }
    field.points(xs, ys, { colors, r: 3.5 });
    curve.y = [0, Math.max(1, ...losses)];
    curve.clear(); curve.line(losses.map((_, i) => i + 1), losses);
    const predictions = model.probabilities(data.x.data);
    let correct = 0;
    for (let i = 0; i < data.y.length; i++) correct += Number(Number(predictions[i]! >= 0.5) === data.y[i]);
    step.set(steps); loss.set(losses.length ? fmt(losses[losses.length - 1]!) : "not trained");
    accuracy.set(`${(100 * correct / data.y.length).toFixed(1)}%`);
  }
  const runner = loop(root, () => {
    losses.push(model.train(data)); steps++;
    if (steps % 5 === 0 || steps === 800) draw();
    if (steps >= 800 || !Number.isFinite(losses[losses.length - 1])) { state.set("stopped"); return false; }
  }, 8);
  function reset() {
    runner.stop(); model = new MLP(width, depth, activation); data = samples(kind);
    steps = 0; losses = []; state.set("paused"); draw();
  }
  root.append(
    row(
      select<Dataset>({ label: "dataset", value: kind, options: ["xor", "circles", "spiral"].map(value => ({ value: value as Dataset, label: value })), onChange: v => { kind = v; reset(); } }),
      slider({ label: "hidden width", min: 2, max: 24, step: 2, value: width, onInput: v => { width = v; reset(); } }),
      slider({ label: "hidden layers", min: 1, max: 4, step: 1, value: depth, onInput: v => { depth = v; reset(); } }),
      select<Activation>({ label: "activation", value: activation, options: ["linear", "relu", "tanh"].map(value => ({ value: value as Activation, label: value })), onChange: v => { activation = v; reset(); } }),
    ),
    row(button("Start", () => { if (steps < 800) { state.set("training"); runner.start(); } }, "primary"), button("Pause", () => { runner.stop(); state.set("paused"); }), button("Reset", reset)),
    row(step, loss, accuracy, state), cols(fieldView, lossView),
    note("Colors show model guesses; dots show training labels."),
  );
  draw();
  return () => runner.stop();
}

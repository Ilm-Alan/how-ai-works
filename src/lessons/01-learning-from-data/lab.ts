import { rng } from "../../lib/rng";
import { button, cols, fmt, h, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { fitPoly, mse, predict } from "./fit";

const truth = (x: number) => Math.sin(2.5 * x) + 0.3 * x;
const MAX_DEG = 14;
const GRID = Array.from({ length: 201 }, (_, i) => -1 + i / 100);

export function mount(root: HTMLElement) {
  let seed = 1;
  let n = 12;
  let noise = 0.25;
  let deg = 3;
  let logLambda = -8;
  let train = { xs: [] as number[], ys: [] as number[] };
  let test = { xs: [] as number[], ys: [] as number[] };

  function sample() {
    const r = rng(seed);
    const draw = (count: number) => {
      const xs = Array.from({ length: count }, () => r.next() * 2 - 1);
      return { xs, ys: xs.map((x) => truth(x) + noise * r.normal()) };
    };
    train = draw(n);
    test = draw(400);
  }

  const fitView = h("div");
  const curveView = h("div");
  const fitChart = chart(fitView, { height: 280, x: [-1, 1], y: [-2.5, 2.5] });
  const curveChart = chart(curveView, { height: 280, x: [0, MAX_DEG], y: [1e-3, 10], logY: true, xLabel: "degree", yLabel: "average squared error" });
  const trainErr = readout("train error");
  const testErr = readout("test error");
  const lambda = () => (logLambda <= -8 ? 0 : 10 ** logLambda);

  function draw() {
    const w = fitPoly(train.xs, train.ys, deg, lambda());
    const pal = fitChart.pal;
    fitChart.clear();
    fitChart.points(test.xs, test.ys, { color: pal.border, r: 2 });
    fitChart.line(GRID, GRID.map(truth), { color: pal.muted, dashed: true });
    fitChart.line(GRID, GRID.map((x) => predict(w, x)), { color: pal.accent });
    fitChart.points(train.xs, train.ys, { color: pal.series[1], r: 4 });
    fitChart.legend([
      { label: "training points", color: pal.series[1]! },
      { label: "fitted model", color: pal.accent },
      { label: "true function", color: pal.muted },
    ]);
    trainErr.set(fmt(mse(w, train.xs, train.ys)));
    testErr.set(fmt(mse(w, test.xs, test.ys)));

    const degs = Array.from({ length: MAX_DEG + 1 }, (_, d) => d);
    const fits = degs.map((d) => fitPoly(train.xs, train.ys, d, lambda()));
    curveChart.clear();
    curveChart.line(degs, fits.map((f) => mse(f, train.xs, train.ys)), { color: curveChart.pal.series[1] });
    curveChart.line(degs, fits.map((f) => mse(f, test.xs, test.ys)), { color: curveChart.pal.accent });
    curveChart.line([deg, deg], [1e-3, 10], { color: curveChart.pal.muted, width: 1, dashed: true });
    curveChart.legend([
      { label: "train", color: curveChart.pal.series[1]! },
      { label: "test", color: curveChart.pal.accent },
    ]);
  }

  const resample = () => {
    sample();
    draw();
  };

  root.append(
    row(
      slider({ label: "degree", min: 0, max: MAX_DEG, step: 1, value: deg, onInput: (v) => ((deg = v), draw()) }),
      slider({ label: "training points", min: 4, max: 60, step: 1, value: n, onInput: (v) => ((n = v), resample()) }),
      slider({ label: "noise", min: 0, max: 0.8, step: 0.05, value: noise, onInput: (v) => ((noise = v), resample()) }),
      slider({
        label: "ridge strength",
        min: -8,
        max: 1,
        step: 0.5,
        value: logLambda,
        format: (v) => (v <= -8 ? "0" : `1e${v}`),
        onInput: (v) => ((logLambda = v), draw()),
      }),
      button("New sample", () => ((seed += 1), resample())),
    ),
    row(trainErr.el, testErr.el),
    cols(fitView, curveView),
  );
  resample();
}

import { rng } from "../../lib/rng";
import { cols, fmt, h, note, readout, row, select, slider, toggle } from "../../ui/kit";
import { chart, mix } from "../../ui/plot";
import { type OptName, run, surfaces } from "./opt";

type SurfaceId = keyof typeof surfaces;
const OPTS: { id: OptName; label: string }[] = [
  { id: "sgd", label: "gradient descent" },
  { id: "momentum", label: "momentum 0.9" },
  { id: "adam", label: "Adam" },
];

export function mount(root: HTMLElement) {
  let sid: SurfaceId = "valley";
  let logLr = -1.4;
  let steps = 60;
  let noise = 0;
  let start: [number, number] = [...surfaces[sid].start];
  const shown: Record<OptName, boolean> = { sgd: true, momentum: true, adam: true };

  const pathView = h("div");
  const lossView = h("div");
  const pathChart = chart(pathView, { height: 320, x: surfaces[sid].x, y: surfaces[sid].y, equalAspect: true });
  const lossChart = chart(lossView, { height: 320, x: [0, steps], y: [1e-6, 100], logY: true, xLabel: "step", yLabel: "loss" });
  const finals = OPTS.map((o) => readout(o.label));

  function draw() {
    const s = surfaces[sid];
    const lr = 10 ** logLr;
    pathChart.x = [...s.x];
    pathChart.y = [...s.y];
    pathChart.clear();
    const pal = pathChart.pal;
    // Background: log-loss shading so valleys are visible.
    const n = 60;
    const lo = Math.log(1e-3);
    const hi = Math.log(Math.max(s.f(s.x[0], s.y[1]), s.f(s.x[1], s.y[0]), 10));
    pathChart.field(n, n, (i, j) => {
      const x = s.x[0] + ((i + 0.5) / n) * (s.x[1] - s.x[0]);
      const y = s.y[1] - ((j + 0.5) / n) * (s.y[1] - s.y[0]);
      const t = (Math.log(s.f(x, y) + 1e-3) - lo) / (hi - lo);
      const tc = Math.min(1, Math.max(0, t));
      // Alternating bands read as contour lines of log-loss.
      return mix(pal.accent, 0.04 + 0.3 * tc + (Math.floor(tc * 14) % 2) * 0.08);
    });
    pathChart.points([s.min[0]], [s.min[1]], { color: pal.fg, r: 4 });

    lossChart.x = [0, steps];
    lossChart.clear();
    OPTS.forEach((o, k) => {
      const color = pal.series[k]!;
      if (!shown[o.id]) return finals[k]!.set("hidden");
      const out = run(s, o.id, lr, steps, start, noise, rng(7));
      pathChart.line(out.xs, out.ys, { color, width: 1.5 });
      pathChart.points(out.xs, out.ys, { color, r: 2 });
      lossChart.line(out.loss.map((_, i) => i), out.loss, { color });
      const diverged = out.loss.length < steps + 1;
      finals[k]!.set(diverged ? `diverged at step ${out.loss.length}` : `loss ${fmt(out.loss[out.loss.length - 1]!)}`);
    });
    pathChart.points([start[0]], [start[1]], { color: pal.fg, r: 5 });
    lossChart.legend(OPTS.filter((o) => shown[o.id]).map((o) => ({ label: o.label, color: pal.series[OPTS.indexOf(o)]! })));
  }

  pathChart.onPointer((x, y, down) => {
    if (!down) return;
    start = [x, y];
    draw();
  });

  root.append(
    row(
      select({
        label: "surface",
        options: (Object.keys(surfaces) as SurfaceId[]).map((id) => ({ value: id, label: surfaces[id].label })),
        value: sid,
        onChange: (v) => {
          sid = v;
          start = [...surfaces[sid].start];
          draw();
        },
      }),
      slider({ label: "learning rate", min: -3, max: 0.3, step: 0.05, value: logLr, format: (v) => fmt(10 ** v, 3), onInput: (v) => ((logLr = v), draw()) }),
      slider({ label: "steps", min: 10, max: 300, step: 10, value: steps, onInput: (v) => ((steps = v), draw()) }),
      slider({ label: "gradient noise", min: 0, max: 2, step: 0.1, value: noise, onInput: (v) => ((noise = v), draw()) }),
    ),
    row(...OPTS.map((o) => toggle({ label: o.label, value: shown[o.id], onChange: (v) => ((shown[o.id] = v), draw()) }))),
    row(...finals),
    cols(pathView, lossView),
    note("Drag the starting point; the dot marks the minimum."),
  );
  draw();
}

import { rng } from "../../lib/rng";
import { fmt, h, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { exact, type Params, simulate } from "./reliability";

const MAX_STEPS = 200;
const pct = (x: number) => `${fmt(x * 100, 1)}%`;

export function mount(root: HTMLElement) {
  const prm: Params = { p: 0.95, steps: 30, detect: 0, retries: 2 };
  const view = h("div");
  const c = chart(view, { height: 300, x: [1, MAX_STEPS], y: [0, 1], xLabel: "steps in task", yLabel: "task success rate" });
  const success = readout("success");
  const silent = readout("wrong without noticing");
  const stopped = readout("stopped and reported failure");
  const sim = readout("simulated success (2,000 runs)");

  function draw() {
    const e = exact(prm);
    success.set(pct(e.success));
    silent.set(pct(e.silent));
    stopped.set(pct(e.stopped));
    sim.set(pct(simulate(prm, 2000, rng(1)).success));

    const ns = Array.from({ length: MAX_STEPS }, (_, i) => i + 1);
    c.clear();
    c.line(ns, ns.map((n) => prm.p ** n), { color: c.pal.muted, dashed: true });
    c.line(ns, ns.map((n) => exact({ ...prm, steps: n }).success), { color: c.pal.accent });
    c.line(ns, ns.map((n) => exact({ ...prm, steps: n }).silent), { color: c.pal.series[1] });
    c.points([prm.steps], [e.success], { color: c.pal.fg, r: 5 });
    c.legend([
      { label: "success, with checks", color: c.pal.accent },
      { label: "wrong without noticing", color: c.pal.series[1]! },
      { label: "success, no checks", color: c.pal.muted },
    ]);
  }

  const set = (key: keyof Params) => (v: number) => {
    prm[key] = v;
    draw();
  };

  root.append(
    row(
      slider({ label: "chance one step works", min: 0.8, max: 0.999, step: 0.001, value: prm.p, onInput: set("p") }),
      slider({ label: "steps", min: 1, max: MAX_STEPS, step: 1, value: prm.steps, onInput: set("steps") }),
    ),
    row(
      slider({ label: "chance a check catches an error", min: 0, max: 1, step: 0.05, value: prm.detect, onInput: set("detect") }),
      slider({ label: "retries per step", min: 0, max: 5, step: 1, value: prm.retries, onInput: set("retries") }),
    ),
    row(success, silent, stopped),
    row(sim),
    view,
  );
  draw();
}

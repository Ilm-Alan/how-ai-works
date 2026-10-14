import { cols, fmt, h, readout, row, slider } from "../../ui/kit";
import { chart, type Chart } from "../../ui/plot";
import { entropyBits, softmax } from "./softmax";

const TOKENS = ["cat", "dog", "car", "the", "ran"];

export function mount(root: HTMLElement) {
  // Matrix A = [[a, b], [c, d]]; columns are where e1 and e2 land.
  const m = { a: 1, b: 0.5, c: 0, d: 1 };
  const v = { x: 1, y: 1 };
  const mapView = h("div");
  const mapChart = chart(mapView, { height: 300, x: [-3, 3], y: [-3, 3], equalAspect: true });
  const det = readout("area scale");
  const av = readout("mapped vector");

  function drawMap() {
    const c = mapChart;
    c.clear();
    const T = (x: number, y: number): [number, number] => [m.a * x + m.b * y, m.c * x + m.d * y];
    for (let k = -4; k <= 4; k++) {
      const [x0, y0] = T(k, -4);
      const [x1, y1] = T(k, 4);
      const [x2, y2] = T(-4, k);
      const [x3, y3] = T(4, k);
      c.line([x0, x1], [y0, y1], { color: c.pal.muted, width: k === 0 ? 1.5 : 0.5 });
      c.line([x2, x3], [y2, y3], { color: c.pal.muted, width: k === 0 ? 1.5 : 0.5 });
    }
    const sq = [T(0, 0), T(1, 0), T(1, 1), T(0, 1), T(0, 0)];
    c.line(sq.map((p) => p[0]), sq.map((p) => p[1]), { color: c.pal.series[4] });
    c.arrow(0, 0, m.a, m.c, { color: c.pal.series[0] });
    c.arrow(0, 0, m.b, m.d, { color: c.pal.series[1] });
    const [vx, vy] = T(v.x, v.y);
    c.arrow(0, 0, v.x, v.y, { color: c.pal.muted, dashed: true });
    c.arrow(0, 0, vx, vy, { color: c.pal.series[2] });
    c.legend([
      { label: "mapped first axis", color: c.pal.series[0]! },
      { label: "mapped second axis", color: c.pal.series[1]! },
      { label: "mapped vector", color: c.pal.series[2]! },
      { label: "unit square", color: c.pal.series[4]! },
    ]);
    det.set(fmt(m.a * m.d - m.b * m.c));
    av.set(`(${fmt(vx, 2)}, ${fmt(vy, 2)})`);
  }

  const mslider = (label: string, key: keyof typeof m) =>
    slider({ label, min: -2, max: 2, step: 0.1, value: m[key], onInput: (x) => ((m[key] = x), drawMap()) });
  const vslider = (label: string, key: keyof typeof v) =>
    slider({ label, min: -2, max: 2, step: 0.1, value: v[key], onInput: (x) => ((v[key] = x), drawMap()) });

  // Softmax panel.
  const logits = [2, 1.5, 0.2, -0.5, -1];
  let logT = 0;
  let target = 0;
  const probView = h("div");
  const probChart = chart(probView, { height: 220, x: [-0.5, TOKENS.length - 0.5], y: [0, 1] });
  const ent = readout("spread");
  const ce = readout("loss");

  function drawProbs() {
    const p = softmax(logits, 10 ** logT);
    const c: Chart = probChart;
    c.clear();
    p.forEach((pi, i) => {
      const [x0, y0] = c.toPx(i - 0.35, pi);
      const [x1, y1] = c.toPx(i + 0.35, 0);
      c.ctx.fillStyle = i === target ? c.pal.series[1]! : c.pal.accent;
      c.ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      c.text(i, Math.min(pi + 0.06, 0.95), fmt(pi, 2), { align: "center", size: 11 });
      c.text(i, 0.97, TOKENS[i]!, { align: "center", color: c.pal.muted, size: 11 });
    });
    ent.set(`${fmt(entropyBits(p), 2)} bits (max ${fmt(Math.log2(p.length), 2)})`);
    ce.set(`${fmt(-Math.log(p[target]!), 3)} nats`);
  }

  root.append(
    h("h3", null, "A matrix moves space"),
    row(mslider("a", "a"), mslider("b", "b"), mslider("c", "c"), mslider("d", "d")),
    row(vslider("v.x", "x"), vslider("v.y", "y"), det, av),
    mapView,
    h("h3", null, "Softmax turns scores into probabilities"),
    cols(
      h(
        "div",
        null,
        ...logits.map((z, i) =>
          row(slider({ label: `score "${TOKENS[i]}"`, min: -4, max: 4, step: 0.1, value: z, onInput: (x) => ((logits[i] = x), drawProbs()) })),
        ),
        row(
          slider({
            label: "temperature",
            min: -1.5,
            max: 1.5,
            step: 0.05,
            value: logT,
            format: (x) => fmt(10 ** x, 2),
            onInput: (x) => ((logT = x), drawProbs()),
          }),
        ),
        row(
          slider({
            label: "right answer",
            min: 0,
            max: TOKENS.length - 1,
            step: 1,
            value: target,
            format: (x) => TOKENS[x]!,
            onInput: (x) => ((target = x), drawProbs()),
          }),
        ),
        row(ent),
        row(ce),
      ),
      probView,
    ),
  );
  drawMap();
  drawProbs();
}

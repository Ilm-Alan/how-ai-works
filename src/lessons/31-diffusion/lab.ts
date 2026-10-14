import { rng } from "../../lib/rng";
import { button, fmt, h, note, readout, row, select, slider } from "../../ui/kit";
import { chart, mix as alpha } from "../../ui/plot";
import { type Mixture, sample } from "./flow";

const N = 600;
const TRAILS = 40;

const presets: Record<"blobs" | "ring" | "spiral", { label: string; m: Mixture }> = {
  blobs: {
    label: "three blobs",
    m: {
      s: 0.18,
      comps: [
        { mx: -1.6, my: -0.8, w: 1, cls: 0 },
        { mx: 1.6, my: -0.8, w: 1, cls: 1 },
        { mx: 0, my: 1.6, w: 1, cls: 1 },
      ],
    },
  },
  ring: {
    label: "ring of eight",
    m: {
      s: 0.12,
      comps: Array.from({ length: 8 }, (_, k) => ({ mx: 2 * Math.cos((k * Math.PI) / 4), my: 2 * Math.sin((k * Math.PI) / 4), w: 1, cls: k % 2 })),
    },
  },
  spiral: {
    label: "spiral",
    m: {
      s: 0.1,
      comps: Array.from({ length: 16 }, (_, k) => {
        const a = 0.6 + k * 0.38;
        const rad = 0.3 + k * 0.14;
        return { mx: rad * Math.cos(a), my: rad * Math.sin(a), w: 1, cls: k < 8 ? 0 : 1 };
      }),
    },
  },
};
type PresetId = keyof typeof presets;

export function mount(root: HTMLElement) {
  let pid: PresetId = "blobs";
  let steps = 30;
  let guideCls = -1;
  let scale = 1;
  let frameAt = 1;
  let seed = 1;
  let frames: Float64Array[] = [];

  const view = h("div");
  const c = chart(view, { height: 380, x: [-3.2, 3.2], y: [-3.2, 3.2], equalAspect: true });
  const tRead = readout("noise level");
  const spread = readout("spread within clusters");
  const offset = readout("distance to nearest cluster");
  const share = readout("share in class A");

  function nearest(m: Mixture, x: number, y: number): { k: number; d: number } {
    let k = 0;
    let d = Infinity;
    m.comps.forEach((comp, j) => {
      const dd = Math.hypot(x - comp.mx, y - comp.my);
      if (dd < d) [k, d] = [j, dd];
    });
    return { k, d };
  }

  function compute() {
    const r = rng(seed);
    const noise = Float64Array.from({ length: 2 * N }, () => r.normal());
    frames = sample(presets[pid].m, noise, steps, guideCls >= 0 ? { cls: guideCls, scale } : undefined);
    const out = frames[frames.length - 1]!;
    const m = presets[pid].m;
    // Group samples by nearest component; spread = std around each group's own mean (diversity),
    // offset = distance to the true center (accuracy).
    const K = m.comps.length;
    const sx = new Float64Array(K);
    const sy = new Float64Array(K);
    const sq = new Float64Array(K);
    const cnt = new Float64Array(K);
    let dsum = 0;
    let a = 0;
    for (let i = 0; i < N; i++) {
      const x = out[2 * i]!;
      const y = out[2 * i + 1]!;
      const { k, d } = nearest(m, x, y);
      dsum += d;
      sx[k]! += x;
      sy[k]! += y;
      sq[k]! += x * x + y * y;
      cnt[k]!++;
      if (m.comps[k]!.cls === 0) a++;
    }
    let within = 0;
    for (let k = 0; k < K; k++) if (cnt[k]) within += sq[k]! - (sx[k]! ** 2 + sy[k]! ** 2) / cnt[k]!;
    spread.set(`${fmt(Math.sqrt(within / (2 * N)), 3)} (data: ${m.s})`);
    offset.set(fmt(dsum / N, 3));
    share.set(`${fmt((a / N) * 100, 1)}%`);
    draw();
  }

  function draw() {
    const m = presets[pid].m;
    const k = Math.round(frameAt * steps);
    const f = frames[k]!;
    tRead.set(fmt(1 - k / steps, 3));
    c.clear();
    const pal = c.pal;
    // Data: 2σ circle around each component, colored by class.
    for (const comp of m.comps) {
      const th = Array.from({ length: 33 }, (_, i) => (i / 32) * 2 * Math.PI);
      c.line(th.map((a) => comp.mx + 2 * m.s * Math.cos(a)), th.map((a) => comp.my + 2 * m.s * Math.sin(a)), {
        color: alpha(comp.cls === 0 ? pal.series[1]! : pal.series[0]!, 0.8),
        width: 1.5,
      });
    }
    // Trails of a few particles up to the current frame.
    for (let i = 0; i < TRAILS; i++) {
      const xs: number[] = [];
      const ys: number[] = [];
      for (let j = 0; j <= k; j++) {
        xs.push(frames[j]![2 * i]!);
        ys.push(frames[j]![2 * i + 1]!);
      }
      c.line(xs, ys, { color: alpha(pal.muted, 0.5), width: 1 });
    }
    const px: number[] = [];
    const py: number[] = [];
    for (let i = 0; i < N; i++) {
      px.push(f[2 * i]!);
      py.push(f[2 * i + 1]!);
    }
    c.points(px, py, { color: pal.fg, r: 1.6 });
  }

  const scaleSlider = slider({ label: "guidance scale", min: 0, max: 8, step: 0.25, value: scale, onInput: (v) => ((scale = v), compute()) });

  root.append(
    row(
      select({
        label: "data",
        options: (Object.keys(presets) as PresetId[]).map((id) => ({ value: id, label: presets[id].label })),
        value: pid,
        onChange: (v) => ((pid = v), compute()),
      }),
      slider({ label: "sampling steps", min: 1, max: 100, step: 1, value: steps, onInput: (v) => ((steps = v), compute()) }),
      button("New noise", () => ((seed += 1), compute())),
    ),
    row(
      select({
        label: "generate",
        options: [
          { value: "-1", label: "unconditional" },
          { value: "0", label: "class A (orange)" },
          { value: "1", label: "class B (blue)" },
        ],
        value: "-1",
        onChange: (v) => ((guideCls = Number(v)), compute()),
      }),
      scaleSlider,
    ),
    row(slider({ label: "show time", min: 0, max: 1, step: 0.01, value: frameAt, format: (v) => `${Math.round(v * 100)}% of the way`, onInput: (v) => ((frameAt = v), draw()) }), tRead),
    row(spread, offset, share),
    view,
    note("Circles show data clusters; gray lines trace points from noise to data."),
  );
  compute();
}

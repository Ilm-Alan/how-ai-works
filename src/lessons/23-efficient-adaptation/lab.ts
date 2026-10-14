import { rng } from "../../lib/rng";
import { cols, fmt, h, note, readout, row, select, slider } from "../../ui/kit";
import { chart, palette } from "../../ui/plot";
import { reconstruct, svd, type SVD } from "./svd";

const N = 96;

type Source = "image" | "update" | "noise";

function makeMatrix(src: Source): Float64Array {
  const r = rng(11);
  const A = new Float64Array(N * N);
  if (src === "image") {
    // A synthetic grayscale picture: smooth shading, a disc, a bar, and some fine texture.
    for (let i = 0; i < N; i++)
      for (let j = 0; j < N; j++) {
        const x = j / N - 0.5;
        const y = i / N - 0.5;
        let v = 0.3 + 0.3 * x;
        if (Math.hypot(x + 0.15, y + 0.1) < 0.22) v += 0.45;
        if (Math.abs(y - 0.28) < 0.06 && x > -0.35 && x < 0.4) v -= 0.35;
        if (Math.abs(x - 0.3) < 0.04) v += 0.2;
        v += 0.05 * Math.sin(40 * x) * Math.sin(40 * y) + 0.03 * r.normal();
        A[i * N + j] = v;
      }
  } else if (src === "update") {
    // Like a fine-tuning weight change: a few strong directions plus small noise.
    for (let k = 0; k < 4; k++) {
      const u = Array.from({ length: N }, () => r.normal());
      const v = Array.from({ length: N }, () => r.normal());
      const s = 1 / (k + 1);
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) A[i * N + j]! += (s * u[i]! * v[j]!) / N;
    }
    for (let i = 0; i < N * N; i++) A[i]! += (0.01 * r.normal()) / Math.sqrt(N);
  } else {
    for (let i = 0; i < N * N; i++) A[i] = r.normal();
  }
  return A;
}

function paint(canvas: HTMLCanvasElement, M: Float64Array, lo: number, hi: number) {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.createImageData(N, N);
  for (let i = 0; i < N * N; i++) {
    const v = Math.round(255 * Math.max(0, Math.min(1, (M[i]! - lo) / (hi - lo))));
    img.data[4 * i] = v;
    img.data[4 * i + 1] = v;
    img.data[4 * i + 2] = v;
    img.data[4 * i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

export function mount(root: HTMLElement) {
  let src: Source = "image";
  let rank = 8;
  const cache: Partial<Record<Source, { A: Float64Array; d: SVD }>> = {};
  const get = () => (cache[src] ??= (() => {
    const A = makeMatrix(src);
    return { A, d: svd(A, N, N) };
  })());

  const canvasStyle = "width: 192px; height: 192px; image-rendering: pixelated; border: 1px solid var(--border)";
  const orig = h("canvas", { width: N, height: N, style: canvasStyle });
  const approx = h("canvas", { width: N, height: N, style: canvasStyle });
  const specView = h("div");
  const spec = chart(specView, { height: 220, x: [1, N], y: [1e-4, 1], logY: true, xLabel: "direction", yLabel: "strength relative to first" });
  const err = readout("relative error");
  const params = readout("numbers stored");

  function draw() {
    const { A, d } = get();
    let lo = Infinity;
    let hi = -Infinity;
    for (const v of A) {
      lo = Math.min(lo, v);
      hi = Math.max(hi, v);
    }
    paint(orig, A, lo, hi);
    paint(approx, reconstruct(d, rank), lo, hi);
    let total = 0;
    let tail = 0;
    d.S.forEach((s, c) => {
      total += s * s;
      if (c >= rank) tail += s * s;
    });
    err.set(`${fmt(Math.sqrt(tail / total) * 100, 3)}%`);
    params.set(`${rank * 2 * N} vs ${N * N} (${fmt((100 * rank * 2 * N) / (N * N), 3)}%)`);
    const s1 = d.S[0]!;
    const xs = Array.from(d.S, (_, i) => i + 1);
    spec.clear();
    spec.line(xs, Array.from(d.S, (s) => s / s1), { color: palette().accent });
    spec.line([rank + 0.5, rank + 0.5], [1e-4, 1], { color: palette().muted, dashed: true, width: 1 });
  }

  // LoRA budget for a Llama-3-8B-shaped model.
  const cfg = { d: 4096, kv: 1024, f: 14336, layers: 32, r: 16 };
  const lora = readout("weights trained");
  const mem = readout("memory for weights and optimizer");
  function drawLora() {
    const { d, kv, f, layers, r } = cfg;
    const full = layers * (2 * d * d + 2 * d * kv + 3 * d * f);
    const adapters = layers * r * (2 * (d + d) + 2 * (d + kv) + 3 * (d + f));
    lora.set(`${fmt(adapters / 1e6, 3)}M of ${fmt(full / 1e9, 3)}B layer weights (${fmt((100 * adapters) / full, 2)}%)`);
    // Full fine-tune: BF16 weights + grads, FP32 master + two Adam moments ≈ 16 B/param.
    // LoRA: frozen base (BF16 = 2 B, or 4-bit ≈ 0.5 B for QLoRA) + 16 B per adapter parameter.
    const gb = (b: number) => `${fmt(b / 1e9, 3)} GB`;
    mem.set(`full ${gb(16 * full)} · LoRA ${gb(2 * full + 16 * adapters)} · QLoRA ${gb(0.5 * full + 16 * adapters)}`);
  }

  root.append(
    row(
      select<Source>({
        label: "matrix",
        options: [
          { value: "image", label: "a picture" },
          { value: "update", label: "a fine-tuning update" },
          { value: "noise", label: "pure noise" },
        ],
        value: src,
        onChange: (v) => ((src = v), draw()),
      }),
      slider({ label: "rank", min: 1, max: N, step: 1, value: rank, onInput: (v) => ((rank = v), draw()) }),
    ),
    row(err, params),
    cols(h("div", null, h("div", { class: "lab-note" }, "original"), orig), h("div", null, h("div", { class: "lab-note" }, `best fit at this rank`), approx), specView),
    h("h3", null, "LoRA on an 8B model"),
    row(slider({ label: "LoRA rank", min: 1, max: 256, step: 1, value: cfg.r, onInput: (v) => ((cfg.r = v), drawLora()) })),
    row(lora),
    row(mem),
    note("Memory counts layer weights and optimizer state only."),
  );
  draw();
  drawLora();
}

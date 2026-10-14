import { button, fmt, h, note, readout, row, select, slider, textInput } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { addIntensity, decodeIntensity, matmulIntensity, minimumDevices, modelMemory, ridgePoint, roofline, type Storage } from "./roofline";
import { accelerators, sources, type Precision } from "./specs";

const bytes: Record<Precision, number> = { bf16: 2, fp8: 1, fp4: 0.5 };
const precisionLabels: Record<Precision, string> = { bf16: "BF16", fp8: "FP8", fp4: "FP4 (ideal payload)" };
const storageOptions: { value: Storage; label: string }[] = [
  { value: "fp32", label: "FP32 — 4 B" }, { value: "bf16", label: "BF16 — 2 B" },
  { value: "fp16", label: "FP16 — 2 B" }, { value: "fp8", label: "FP8 — 1 B (+ tensor scales)" },
  { value: "fp4", label: "FP4 payload — 0.5 B (no scales)" },
  { value: "mxfp4", label: "MXFP4 — 0.53125 B" }, { value: "nvfp4", label: "NVFP4 — 0.5625 B (+ tensor scales)" },
];

export function mount(root: HTMLElement): void {
  let device = accelerators[0]!;
  let precision: Precision = "bf16";
  let n = 1024;
  let batch = 1;
  let paramsB = 70;
  let format: Storage = "bf16";
  let training = false;
  let edited = false;

  const precisionHost = h("div");
  const citations = h("p", { class: "lab-note" });
  const warning = note("");
  const view = h("div");
  const c = chart(view, { height: 300, x: [-2, 5], y: [0.01, 10000], logY: true, xLabel: "log₁₀ work per byte", yLabel: "speed limit (TFLOP/s)" });
  const ridge = readout("memory/compute crossover");
  const matmul = readout("matrix multiply: work per byte / speed");
  const add = readout("addition: work per byte / speed");
  const decode = readout("next token: work per byte / speed");
  const memory = readout("model memory (GB)");
  const devices = readout("chips needed for storage");
  const capacity = readout("chip memory (GB)");
  const peak = textInput({ label: "chip peak (TFLOP/s)", value: String(device.peak[precision]), onInput: () => { edited = true; draw(); } });
  const bandwidth = textInput({ label: "memory speed (TB/s)", value: String(device.bandwidth), onInput: () => { edited = true; draw(); } });

  function applyPreset(): void {
    if (device.peak[precision] === undefined) precision = "bf16";
    const control = select<Precision>({
      label: "number format",
      options: (Object.keys(device.peak) as Precision[]).map((value) => ({ value, label: precisionLabels[value] })),
      value: precision,
      onChange: (v) => { precision = v; peak.value = String(device.peak[v]); edited = false; bandwidth.value = String(device.bandwidth); draw(); },
    });
    precisionHost.replaceChildren(control.el);
    peak.value = String(device.peak[precision]);
    bandwidth.value = String(device.bandwidth);
    edited = false;
    citations.replaceChildren(
      "Vendor presets, accessed October 2026. ",
      ...device.sourceIndices.map((index) => h("a", { href: sources[index]!.url, target: "_blank", rel: "noopener noreferrer" }, sources[index]!.label, " ")),
    );
    draw();
  }

  function draw(): void {
    const p = Number(peak.value) * 1e12;
    const bw = Number(bandwidth.value) * 1e12;
    capacity.set(fmt(device.capacity));
    const mem = modelMemory(paramsB * 1e9, format, training);
    memory.set(fmt(mem / 1e9));
    devices.set(minimumDevices(mem, device.capacity * 1e9));
    c.clear();
    if (!(Number.isFinite(p) && p > 0 && Number.isFinite(bw) && bw > 0)) {
      warning.textContent = "Enter positive, finite peak and bandwidth values.";
      for (const out of [ridge, matmul, add, decode]) out.set("—");
      return;
    }
    const r = ridgePoint(p, bw);
    ridge.set(fmt(r));
    warning.textContent = `${edited ? "Custom roofline; HBM capacity still uses the selected device. " : ""}${device.caveat}`;
    const operations = [
      { label: "matrix multiply", intensity: matmulIntensity(n, bytes[precision]), out: matmul },
      { label: "addition", intensity: addIntensity(bytes[precision]), out: add },
      { label: "next token", intensity: decodeIntensity(batch, bytes[precision]), out: decode },
    ];
    const xMin = Math.min(-2, Math.log10(r) - 1);
    const xMax = Math.max(5, Math.log10(r) + 1);
    c.x = [xMin, xMax];
    c.y = [Math.max(Number.MIN_VALUE, Math.min(bw * 10 ** xMin, p) / 1e12 / 2), p / 1e12 * 1.5];
    c.clear();
    c.line([xMin, Math.log10(r), xMax], [roofline(p, bw, 10 ** xMin) / 1e12, p / 1e12, p / 1e12], { color: c.pal.accent });
    c.line([Math.log10(r), Math.log10(r)], c.y, { color: c.pal.muted, dashed: true });
    for (let i = 0; i < operations.length; i++) {
      const op = operations[i]!;
      const bound = roofline(p, bw, op.intensity) / 1e12;
      const color = c.pal.series[i]!;
      c.points([Math.log10(op.intensity)], [bound], { color, r: 5 });
      op.out.set(`${fmt(op.intensity)} / ${fmt(bound)} TFLOP/s (${op.intensity < r ? "memory" : "compute"})`);
    }
    c.legend([{ label: "roof", color: c.pal.accent }, ...operations.map((op, i) => ({ label: op.label, color: c.pal.series[i]! }))]);
  }

  const accelerator = select({ label: "accelerator (one GPU/chip)", value: device.id, options: accelerators.map((a) => ({ value: a.id, label: a.label })), onChange: (id) => { device = accelerators.find((a) => a.id === id)!; applyPreset(); } });
  const matrixSize = slider({ label: "matrix side", min: 4, max: 15, step: 1, value: 10, map: (v) => 2 ** v, format: (v) => String(v), onInput: (v) => { n = v; draw(); } });
  const batchSize = slider({ label: "decode batch", min: 0, max: 12, step: 1, value: 0, map: (v) => 2 ** v, format: (v) => String(v), onInput: (v) => { batch = v; draw(); } });
  const modelSize = slider({ label: "parameters (billions)", min: 1, max: 1000, step: 1, value: paramsB, onInput: (v) => { paramsB = v; draw(); } });
  const storage = select<Storage>({ label: "inference weight storage", value: format, options: storageOptions, onChange: (v) => { format = v; draw(); } });
  const mode = select({ label: "memory use", value: "inference", options: [{ value: "inference", label: "weights only" }, { value: "training", label: "training: 16 bytes per weight" }], onChange: (v) => { training = v === "training"; draw(); } });
  root.append(
    row(accelerator, precisionHost), row(peak, bandwidth), citations, warning,
    row(matrixSize, batchSize), view, row(ridge), row(matmul, add, decode),
    note("Reusing numbers raises work per byte."),
    h("h3", null, "Does the model fit?"), row(modelSize, storage, mode), row(capacity, memory, devices),
    note("Other working memory adds to the total."),
    button("Reset", () => {
      device = accelerators[0]!; accelerator.value = device.id; precision = "bf16";
      n = 1024; matrixSize.value = 10; batch = 1; batchSize.value = 0;
      paramsB = 70; modelSize.value = paramsB; format = "bf16"; storage.value = format;
      training = false; mode.value = "inference"; applyPreset();
    }),
  );
  applyPreset();
}

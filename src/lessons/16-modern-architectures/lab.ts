import { fmt, h, note, readout, row, select, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { cache, DEEPSEEK_V3, moe, QWEN_32B, type Attention, type CacheConfig } from "./architecture";

export function mount(root: HTMLElement) {
  let config: CacheConfig = { ...QWEN_32B };
  let experts = 64, topK = 4, expertB = 0.1, sharedB = 1;
  const token = readout("cache bytes per token");
  const sequence = readout("cache per answer");
  const grouping = readout("query heads per shared set");
  const total = readout("total weights");
  const active = readout("weights used per token");
  const flops = readout("weight operations per token");
  const view = h("div");
  const c = chart(view, { height: 260, x: [0, 131072], y: [0, 40], xLabel: "context tokens", yLabel: "cache (GiB)" });
  const contexts = Array.from({ length: 65 }, (_, i) => i * 2048);

  function draw() {
    const result = cache(config), m = moe({ experts, topK, expertParameters: expertB * 1e9, sharedParameters: sharedB * 1e9 });
    token.set(result.bytesPerToken.toLocaleString());
    sequence.set(`${fmt(result.sequenceBytes / 2 ** 30, 3)} GiB (${result.sequenceBytes.toLocaleString()} bytes)`);
    grouping.set(config.attention === "mla" ? "latent shared across heads" : fmt(config.heads / (config.attention === "mha" ? config.heads : config.kvHeads), 1));
    total.set(`${fmt(m.total / 1e9, 2)}B`);
    active.set(`${fmt(m.active / 1e9, 2)}B (${fmt(100 * m.active / m.total, 1)}%)`);
    flops.set(`${fmt(m.matmulFlops / 1e9, 2)} billion`);
    const full = contexts.map((context) => cache({ ...config, attention: config.attention === "window" ? "gqa" : config.attention, context }).sequenceBytes / 2 ** 30);
    const actual = contexts.map((context) => cache({ ...config, context }).sequenceBytes / 2 ** 30);
    c.y = [0, Math.max(0.1, ...full) * 1.1];
    c.clear();
    c.line(contexts, full, { color: c.pal.muted, dashed: true });
    c.line(contexts, actual, { color: c.pal.accent });
    c.points([config.context], [result.sequenceBytes / 2 ** 30], { color: c.pal.fg, r: 5 });
    c.legend([{ label: "chosen layout", color: c.pal.accent }, { label: "without local eviction", color: c.pal.muted }]);
  }

  const attention = select<Attention>({ label: "attention", value: "gqa", options: [
    { value: "mha", label: "separate keys and values" }, { value: "gqa", label: "shared keys and values" },
    { value: "mla", label: "compressed keys and values" }, { value: "window", label: "local window + global layers" },
  ], onChange: (v) => { config.attention = v; draw(); } });
  const layers = slider({ label: "layers", min: 1, max: 96, step: 1, value: config.layers, onInput: (v) => { config.layers = v; config.globalLayers = Math.min(config.globalLayers, v); globals.value = config.globalLayers; draw(); } });
  const heads = select({ label: "query heads", value: "40", options: [8, 16, 32, 40, 64, 128].map((v) => ({ value: String(v), label: String(v) })), onChange: (v) => { config.heads = Number(v); if (kv.value === "all") config.kvHeads = config.heads; draw(); } });
  const kv = select({ label: "key/value heads", value: "8", options: [1, 2, 4, 8].map((v) => ({ value: String(v), label: String(v) })).concat([{ value: "all", label: "all query heads" }]), onChange: (v) => { config.kvHeads = v === "all" ? config.heads : Number(v); draw(); } });
  const dim = slider({ label: "values per head", min: 32, max: 256, step: 32, value: 128, onInput: (v) => { config.headDim = v; draw(); } });
  const latent = slider({ label: "compressed summary width", min: 64, max: 1024, step: 64, value: 512, onInput: (v) => { config.latentDim = v; draw(); } });
  const rope = slider({ label: "position key width", min: 0, max: 128, step: 16, value: 64, onInput: (v) => { config.ropeDim = v; draw(); } });
  const globals = slider({ label: "global layers (window only)", min: 0, max: 96, step: 1, value: 0, onInput: (v) => { config.globalLayers = Math.min(v, config.layers); globals.value = config.globalLayers; draw(); } });
  const precision = select({ label: "bytes per cached value", value: "2", options: [{ value: "1", label: "1 byte" }, { value: "2", label: "2 bytes" }, { value: "4", label: "4 bytes" }], onChange: (v) => { config.bytes = Number(v); draw(); } });
  const preset = select({ label: "model preset", value: "qwen", options: [{ value: "qwen", label: "Qwen2.5-32B" }, { value: "deepseek", label: "DeepSeek-V3" }], onChange: (v) => {
    config = { ...(v === "qwen" ? QWEN_32B : DEEPSEEK_V3) };
    attention.value = config.attention; layers.value = config.layers; heads.value = String(config.heads);
    kv.value = config.kvHeads === config.heads ? "all" : String(config.kvHeads);
    dim.value = config.headDim; latent.value = config.latentDim; rope.value = config.ropeDim;
    globals.value = 0; precision.value = "2"; context.value = 15; windowSize.value = 12;
    draw();
  } });
  const context = slider({ label: "context tokens", min: 8, max: 17, step: 1, value: 15, map: (v) => 2 ** v, format: (v) => v.toLocaleString(), onInput: (v) => { config.context = v; draw(); } });
  const windowSize = slider({ label: "retained local window", min: 8, max: 17, step: 1, value: 12, map: (v) => 2 ** v, format: (v) => v.toLocaleString(), onInput: (v) => { config.window = v; draw(); } });
  const k = slider({ label: "experts selected per token", min: 1, max: 16, step: 1, value: topK, onInput: (v) => { topK = Math.min(v, experts); k.value = topK; draw(); } });
  root.append(row(preset, attention), row(layers, heads, kv, dim), row(latent, rope, precision), row(context, windowSize, globals), row(token, sequence, grouping), view,
    note("Local layers drop entries older than their window."),
    h("h3", null, "Expert weights"),
    row(slider({ label: "experts", min: 8, max: 256, step: 8, value: experts, onInput: (v) => { experts = v; topK = Math.min(topK, v); k.value = topK; draw(); } }), k,
      slider({ label: "weights per expert (billions)", min: 0.01, max: 1, step: 0.01, value: expertB, onInput: (v) => { expertB = v; draw(); } }),
      slider({ label: "shared weights (billions)", min: 0, max: 10, step: 0.25, value: sharedB, onInput: (v) => { sharedB = v; draw(); } })),
    row(total, active, flops), note("All experts need storage, even when a token uses only a few."));
  draw();
}

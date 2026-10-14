import { button, cols, fmt, h, note, readout, row, select, slider, toggle } from "../../ui/kit";
import { palette } from "../../ui/plot";
import { patches, providerTokens, clipLoss, similarityBatch } from "./multimodal";

export function mount(root: HTMLElement) {
  let width = 512;
  let height = 384;
  let size = 32;
  let preset = "patches";
  let temperature = 0.2;
  let noise = 0.1;
  let swapped = false;
  let price = 1;
  const canvas = h("canvas", { width: 512, height: 384, role: "img", "aria-label": "Procedural document image with patch boundaries", style: "width:100%;height:auto" });
  const count = readout("image patch tokens");
  const attention = readout("attention scores per head");
  const billing = readout("billing tokens");
  const cost = readout("image input cost");
  const dimensions = readout("grid / padded image size");
  const provider = readout("resized image / billed tiles");
  const loss = readout("matching loss");
  const directional = readout("image-to-caption / caption-to-image loss");
  const matrix = h("div", { "aria-live": "polite" });
  const imagePane = h("div", null, canvas);
  const contrastPane = h("div", null, h("h3", null, "Image and caption matches"), matrix);

  function drawImage() {
    const pal = palette();
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = pal.surface;
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = pal.accent;
    ctx.fillRect(width * 0.08, height * 0.12, width * 0.5, height * 0.1);
    ctx.fillStyle = pal.fg;
    ctx.font = `${Math.max(8, height * 0.045)}px system-ui`;
    ctx.fillText("PATCHES ≠ WORDS", width * 0.08, height * 0.33);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = pal.series[i % pal.series.length]!;
      ctx.fillRect(width * 0.08, height * (0.42 + i * 0.06), width * (0.3 + (i % 3) * 0.17), height * 0.02);
    }
    const grid = patches(width, height, size);
    ctx.strokeStyle = pal.border;
    ctx.lineWidth = Math.max(1, width / 512);
    ctx.beginPath();
    for (let x = 0; x <= width; x += size) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += size) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();
    count.set(grid.tokens);
    attention.set(grid.tokens ** 2);
    dimensions.set(`${grid.cols} × ${grid.rows} / ${grid.paddedWidth} × ${grid.paddedHeight} px`);
    const p = providerTokens(width, height);
    provider.set(`${p.width} × ${p.height} px / ${p.tiles} tiles`);
    billing.set(preset === "provider" ? p.tokens : "Not an API billing rule");
    cost.set(preset === "provider" ? `$${fmt(p.tokens * price / 1e6, 6)}` : "—");
  }

  function drawContrast() {
    const scores = similarityBatch(30, noise, swapped);
    const result = clipLoss(scores, temperature);
    const pal = palette();
    const table = h("table", { style: "width:100%;font-variant-numeric:tabular-nums" },
      h("caption", null, "Each cell: match score / caption chance; diagonal cells are the labeled pairs."),
      h("thead", null, h("tr", null, h("th", { scope: "col" }, "Image / text"), ...scores.map((_, j) => h("th", { scope: "col" }, `T${j + 1}`)))),
      h("tbody", null, ...scores.map((r, i) => h("tr", null, h("th", { scope: "row" }, `I${i + 1}`), ...r.map((s, j) => h("td", { style: `padding:0.5rem;border:1px solid ${i === j ? pal.accent : pal.border}` }, `${fmt(s, 2)} / ${fmt(result.rowProb[i]![j]!, 2)}`))))),
    );
    matrix.replaceChildren(table);
    loss.set(fmt(result.loss, 4));
    directional.set(`${fmt(result.imageLoss, 4)} / ${fmt(result.textLoss, 4)}`);
  }

  const w = slider({ label: "image width (px)", min: 128, max: 1024, step: 16, value: width, onInput: v => { width = v; drawImage(); } });
  const ht = slider({ label: "image height (px)", min: 128, max: 1024, step: 16, value: height, onInput: v => { height = v; drawImage(); } });
  const patch = slider({ label: "patch side (px)", min: 8, max: 64, step: 8, value: size, onInput: v => { size = v; drawImage(); } });
  const temp = slider({ label: "temperature", min: 0.02, max: 1, step: 0.02, value: temperature, onInput: v => { temperature = v; drawContrast(); } });
  const perturb = slider({ label: "vector noise", min: 0, max: 1, step: 0.05, value: noise, onInput: v => { noise = v; drawContrast(); } });
  const swap = toggle({ label: "swap captions 1 and 2", value: swapped, onChange: v => { swapped = v; drawContrast(); } });
  const mode = select({ label: "billing preset", value: preset, options: [{ value: "patches", label: "Patch grid" }, { value: "provider", label: "OpenAI GPT-4.1 high detail" }], onChange: v => { preset = v; drawImage(); } });
  const rate = slider({ label: "assumed input price ($ / million tokens)", min: 0, max: 20, step: 0.5, value: price, onInput: v => { price = v; drawImage(); } });
  root.append(
    row(w, ht, patch, mode, rate), row(count, attention, dimensions, billing, cost, provider),
    note("The patch grid and billing tiles use separate rules."),
    cols(imagePane, contrastPane), row(temp, perturb, swap, loss, directional),
    note("The matching panel uses vectors separate from the image."),
    button("Reset", () => {
      width = w.value = 512; height = ht.value = 384; size = patch.value = 32;
      temperature = temp.value = 0.2; noise = perturb.value = 0.1;
      swapped = swap.value = false; preset = mode.value = "patches"; price = rate.value = 1;
      drawImage(); drawContrast();
    }),
  );
  drawImage(); drawContrast();
}

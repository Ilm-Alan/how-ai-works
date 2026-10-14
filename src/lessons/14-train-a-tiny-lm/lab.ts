import { rng } from "../../lib/rng";
import { button, fmt, h, loop, note, readout, row, select, slider, textInput } from "../../ui/kit";
import { chart, heatmap } from "../../ui/plot";
import { corpus, defaults, TinyLM, type Corpus } from "./model";
import { texts } from "./texts";

export function mount(root: HTMLElement) {
  let config = { ...defaults }, source = "sonnets", pasted = "", prompt = "Thou art ", temperature = 0.8;
  let layer = 0, head = 0, data: Corpus | undefined, model: TinyLM | undefined;
  let training = false, steps = 0, sum = 0, count = 0, baseline = 0, evalIndex = 0, evalSum = 0;
  let evaluating = false, sampling: { next(): number } | undefined, sampleCount = 0, draft = "";
  let trainXs: number[] = [], trainYs: number[] = [], valXs: number[] = [], valYs: number[] = [];
  const state = readout("state", "paused"), step = readout("step", "0"), trainLoss = readout("training loss"), valLoss = readout("unseen text loss");
  const size = readout("weights"), baselineValue = readout("equal-chance loss"), splitValue = readout("training / unseen characters");
  const output = h("pre", { "aria-label": "Generated sample", "aria-live": "polite" });
  const sampleLabel = h("h4", null, "Sample: untrained");
  const lossView = h("div"), attentionView = h("div", null, h("h4", null, "Attention: rows look at columns"));
  const curve = chart(lossView, { x: [0, 500], y: [0, 5], height: 280, xLabel: "training step", yLabel: "loss per character" });
  const map = heatmap(attentionView, { cell: 20 });

  function drawCurve() {
    curve.x = [0, Math.max(500, steps)];
    curve.y = [0, Math.max(baseline + 0.3, ...trainYs, ...valYs)];
    curve.clear();
    curve.line([0, curve.x[1]], [baseline, baseline], { dashed: true, color: curve.pal.muted });
    curve.line(trainXs, trainYs, { color: curve.pal.series[0] });
    curve.line(valXs, valYs, { color: curve.pal.series[1] });
    curve.legend([{ label: "training: 25-step mean", color: curve.pal.series[0]! }, { label: "unseen text", color: curve.pal.series[1]! }, { label: "equal chances", color: curve.pal.muted }]);
  }
  function drawAttention() {
    if (!model || !data) return;
    const a = model.attention(prompt, data, layer, head);
    const labels = Array.from(a.ids, id => data!.chars[id]!).map((c, i) => `${i}:${c === " " ? "·" : c === "\n" ? "↵" : c}`);
    map.update(a.weights, a.ids.length, a.ids.length, { range: [0, 1], rowLabels: labels, colLabels: labels });
  }
  function beginSample() {
    if (!model || !data) return;
    sampling = model.generateTokens(model.prompt(prompt, data), temperature, rng(140 + steps));
    sampleCount = 0; draft = prompt; output.textContent = draft;
    sampleLabel.textContent = `Sample at step ${steps} · temperature ${fmt(temperature, 2)}`;
    drawAttention(); runner.start();
  }
  const runner = loop(root, () => {
    if (!model || !data) return false;
    if (evaluating) {
      // One held-out sequence per tick; this RNG-free grid stays fixed across runs.
      const t = config.context;
      const start = Math.floor(evalIndex * (data.validation.length - t - 1) / 7);
      evalSum += model.evaluate(data.validation.subarray(start, start + t + 1), 1);
      if (++evalIndex === 8) {
        const value = evalSum / 8;
        valXs.push(steps); valYs.push(value); valLoss.set(fmt(value)); evaluating = false;
        drawCurve();
        if (steps % 100 === 0) beginSample();
      }
    } else if (sampling) {
      draft += data.chars[sampling.next()]!;
      if (++sampleCount % 8 === 0) output.textContent = draft;
      if (sampleCount >= 160) { output.textContent = draft; sampling = undefined; }
    } else if (training) {
      const value = model.train(data.train);
      if (!Number.isFinite(value)) { training = false; state.set("non-finite loss; lower learning rate and Reset"); return false; }
      sum += value; count++; steps++; step.set(String(steps));
      if (steps % 25 === 0) {
        trainXs.push(steps); trainYs.push(sum / count); trainLoss.set(fmt(sum / count)); sum = 0; count = 0;
        evalIndex = 0; evalSum = 0; evaluating = true;
      }
    } else { state.set("paused"); return false; }
  }, 8);

  function reset() {
    runner.stop(); training = false; sampling = undefined; evaluating = false;
    steps = 0; sum = 0; count = 0; trainXs = []; trainYs = []; valXs = []; valYs = [];
    state.set("paused"); step.set("0"); trainLoss.set("not trained"); valLoss.set("not measured");
    try {
      const text = source === "paste" ? Array.from(pasted).slice(0, 100_000).join("") : texts.find(t => t.id === source)!.text;
      data = corpus(text, config.context); model = new TinyLM(data.chars.length, config);
      baseline = Math.log(data.chars.length); baselineValue.set(fmt(baseline)); size.set(String(model.parameterCount));
      splitValue.set(`${data.train.length} / ${data.validation.length}`); drawCurve(); beginSample();
    } catch (error) {
      model = undefined; data = undefined; state.set(error instanceof Error ? error.message : String(error));
      output.textContent = "Add more training text, then Reset.";
      map.update([0], 1, 1, { range: [0, 1] });
      size.set("—"); splitValue.set("—"); baselineValue.set("—"); baseline = 0; drawCurve();
    }
  }
  const layerControl = select<string>({ label: "Attention layer", value: "0", options: [{ value: "0", label: "1" }, { value: "1", label: "2 (requires two layers)" }], onChange: v => {
    layer = Math.min(Number(v), config.layers - 1); layerControl.value = String(layer); drawAttention();
  } });
  const pasteControl = textInput({ label: "Your text (first 100,000 characters; paste then Reset)", value: pasted, multiline: true, rows: 3, onInput: v => { pasted = v; } });
  pasteControl.el.hidden = true;
  root.append(
    row(select({ label: "Training text", value: source, options: [...texts.map(t => ({ value: t.id as string, label: t.label })), { value: "paste", label: "Paste your own" }], onChange: v => {
      source = v; pasteControl.el.hidden = source !== "paste"; reset();
    } })), pasteControl.el,
    row(
      slider({ label: "Layers", min: 1, max: 2, step: 1, value: config.layers, onInput: v => { config.layers = v; layer = Math.min(layer, v - 1); layerControl.value = String(layer); reset(); } }),
      select({ label: "Width", value: String(config.width), options: [16, 32, 48, 64].map(v => ({ value: String(v), label: String(v) })), onChange: v => { config.width = Number(v); reset(); } }),
      select({ label: "Context (characters)", value: String(config.context), options: [16, 32, 48, 64].map(v => ({ value: String(v), label: String(v) })), onChange: v => { config.context = Number(v); reset(); } }),
      slider({ label: "Learning rate", min: -4, max: -1.7, step: 0.1, value: Math.log10(config.lr), map: v => 10 ** v, format: v => fmt(v, 4), onInput: v => { config.lr = v; if (model) model.optimizer.lr = v; } }),
    ),
    row(button("Start", () => { if (model) { training = true; state.set("training"); runner.start(); } }, "primary"), button("Pause", () => { training = false; state.set("paused; finishing pending sample / evaluation"); }), button("Reset", reset)),
    row(state, step, trainLoss, valLoss), row(size, baselineValue, splitValue), lossView,
    note("Each step trains on four windows; the last 10% of the text stays unseen."),
    row(textInput({ label: "Prompt (last context characters used)", value: prompt, onInput: v => { prompt = v; drawAttention(); } }), slider({ label: "Sample temperature", min: 0, max: 1.5, step: 0.05, value: temperature, onInput: v => { temperature = v; beginSample(); } }), button("New sample", beginSample)),
    sampleLabel, output,
    row(layerControl, select({ label: "Attention head", value: String(head), options: [{ value: "0", label: "1" }, { value: "1", label: "2" }], onChange: v => { head = Number(v); drawAttention(); } })),
    attentionView,
    note("Bright cells show attention weight; spaces are · and line breaks are ↵."),
  );
  reset();
  return () => runner.stop();
}

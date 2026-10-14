import { rng } from "../../lib/rng";
import { button, fmt, h, note, readout, row, slider, textInput } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { corpus } from "./corpus";
import { distribution, filter, generate, loss, train, type Filters } from "./ngram";
export function mount(root: HTMLElement) {
  let text = corpus, order = 3, prompt = "Alice ";
  const options: Filters = { temperature: 1, topK: 0, topP: 1, minP: 0 };
  let split = Math.floor(text.length * 0.8), model = train(text.slice(0, split), order, text);
  const view = h("div"), generated = h("pre", { style: "white-space:pre-wrap" }), table = h("pre");
  const plot = chart(view, { height: 230, x: [0, 15], y: [0, 1], xLabel: "character rank (see list)", yLabel: "probability" });
  const trainLoss = readout("training loss"), valLoss = readout("test loss"), ppl = readout("test perplexity"), matched = readout("characters matched"), unknown = readout("new test characters");
  function draw() {
    const raw = distribution(model, prompt), after = filter(raw.probabilities, options);
    const ranked = raw.probabilities.map((p, i) => ({ p, i })).sort((a, b) => b.p - a.p).slice(0, 16);
    plot.clear(); plot.line(ranked.map((_, i) => i), ranked.map(p => p.p), { color: plot.pal.muted }); plot.line(ranked.map((_, i) => i), ranked.map(p => after[p.i]!), { color: plot.pal.accent });
    plot.legend([{ label: "model", color: plot.pal.muted }, { label: "after filters", color: plot.pal.accent }]);
    table.textContent = ranked.map((p, rank) => `${rank.toString().padStart(2)} ${JSON.stringify(model.alphabet[p.i]).padEnd(7)} ${fmt(p.p)} → ${fmt(after[p.i]!)}`).join("\n");
    matched.set(raw.matched); generated.textContent = generate(model, prompt, 220, options, rng(7));
  }
  function rebuild() {
    const bounded = text.slice(0, 4000); split = Math.floor(bounded.length * 0.8); model = train(bounded.slice(0, split), order, bounded);
    const training = loss(model, bounded.slice(0, split)), held = loss(model, bounded.slice(split), bounded.slice(0, split));
    trainLoss.set(fmt(training.nats)); valLoss.set(fmt(held.nats)); ppl.set(fmt(held.perplexity)); unknown.set(held.unknown); draw();
  }
  const input = textInput({ label: "corpus (first 4,000 characters; last 20% held out)", value: text, multiline: true, rows: 4, onInput: v => { text = v; rebuild(); } });
  const promptInput = textInput({ label: "prompt (up to five trailing characters determine the distribution)", value: prompt, onInput: v => { prompt = v.slice(-200); draw(); } });
  root.append(input.el, row(slider({ label: "order", min: 1, max: 6, step: 1, value: order, onInput: v => { order = v; rebuild(); } }), slider({ label: "temperature", min: 0, max: 2, step: 0.1, value: 1, onInput: v => { options.temperature = v; draw(); } }), slider({ label: "top-k (0 = off)", min: 0, max: 30, step: 1, value: 0, onInput: v => { options.topK = v; draw(); } }), slider({ label: "top-p", min: 0.05, max: 1, step: 0.05, value: 1, onInput: v => { options.topP = v; draw(); } }), slider({ label: "min-p", min: 0, max: 0.5, step: 0.05, value: 0, onInput: v => { options.minP = v; draw(); } })), promptInput.el,
    row(button("Reset corpus and seed", () => { text = corpus; input.value = text; prompt = "Alice "; promptInput.value = prompt; rebuild(); }), trainLoss, valLoss, ppl, unknown, matched), view, table, generated,
    note("The first 80% trains the model; the last 20% tests it."));
  rebuild();
}

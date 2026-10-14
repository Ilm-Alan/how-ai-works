import { button, fmt, h, loop, note, readout, row, slider, textInput } from "../../ui/kit";
import { palette } from "../../ui/plot";
import { decode, displayToken, encode, train, trainSteps } from "./bpe";
import { corpus } from "./corpus";
export function mount(root: HTMLElement) {
  let training = corpus, probe = "Alice followed the rabbit. 123456789 café 猫", merges = 30;
  let model = train("", 0), steps = trainSteps(training, 100), trained = 0;
  const tokens = h("div", { "aria-label": "Encoded tokens", style: "line-height:2.5;overflow-wrap:anywhere" });
  const list = h("pre", { style: "max-height:180px;overflow:auto" });
  const count = readout("tokens"), ratio = readout("tokens per space-separated word"), status = readout("learned joins"), roundtrip = readout("text comes back unchanged");
  function draw() {
    const ids = encode(probe, model, merges), pal = palette();
    tokens.replaceChildren(...ids.map((id, i) => h("span", { title: `Token ${id}`, style: `border:1px solid ${pal.series[i % 6]};padding:3px;margin:2px;white-space:pre-wrap` }, displayToken(id, model))));
    count.set(ids.length); ratio.set(fmt(ids.length / Math.max(1, probe.trim().split(/\s+/).filter(Boolean).length)));
    roundtrip.set(decode(ids, model) === probe ? "yes" : "no");
    status.set(`${trained}/100 merges learned; ${Math.min(merges, trained)} applied`);
    list.textContent = model.merges.slice(0, merges).map((m, i) => `${i + 1}. ${displayToken(m.left, model)} + ${displayToken(m.right, model)} → ${displayToken(m.id, model)} (${m.count} pairs)`).join("\n");
  }
  const runner = loop(root, () => {
    const step = steps.next();
    if (step.value) { model = step.value; trained = model.merges.length; }
    draw(); return !step.done;
  }, 2);
  function reset() { runner.stop(); model = train("", 0); trained = 0; steps = trainSteps(training.slice(0, 8000), 100); draw(); }
  root.append(textInput({ label: "training text (first 8,000 characters used)", value: training, multiline: true, rows: 4, onInput: v => { training = v; reset(); } }).el,
    row(button("Start", () => runner.start(), "primary"), button("Pause", () => runner.stop()), button("Reset", reset), slider({ label: "merges applied", min: 0, max: 100, step: 1, value: merges, onInput: v => { merges = v; draw(); } })),
    textInput({ label: "text to encode", value: probe, onInput: v => { probe = v.slice(0, 1000); draw(); } }).el, row(status, count, ratio, roundtrip), tokens, list,
    note("Join all token bytes before reading them as text."));
  draw();
  return () => runner.stop();
}

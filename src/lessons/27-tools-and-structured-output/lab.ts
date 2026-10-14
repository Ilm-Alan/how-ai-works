import { button, fmt, h, note, readout, row, slider, toggle } from "../../ui/kit";
import { generate, schema, validityRate, vocabulary, type Options } from "./decoder";
export function mount(root: HTMLElement) {
  const options: Options = { seed: 1, masked: true, temperature: 1, noise: 0.5 };
  let selectedStep = 0;
  const validity = readout("Passing samples out of 200: rules on / off");
  const state = readout("Current format rule");
  const result = readout("Does the sample pass?");
  const output = h("pre", { style: "white-space:pre-wrap;overflow-wrap:anywhere" });
  const prefix = h("pre", { style: "white-space:pre-wrap;overflow-wrap:anywhere" });
  const probabilities = h("div", { style: "overflow-x:auto" });
  const stepControl = slider({ label: "generation step", min: 1, max: 32, step: 1, value: 1, onInput: v => { selectedStep = v - 1; drawTrace(); } });
  let sample = generate(options);
  function drawTrace() {
    selectedStep = Math.min(selectedStep, sample.steps.length - 1);
    stepControl.value = selectedStep + 1;
    const range = stepControl.el.querySelector("input")!;
    range.max = String(sample.steps.length);
    const step = sample.steps[selectedStep]!;
    state.set(`${step.state} → sampled ${step.chosen}`);
    result.set(sample.valid ? "Valid JSON matching schema" : "Invalid JSON or schema mismatch");
    output.textContent = sample.text || "(empty output)";
    prefix.textContent = `Prefix before step ${selectedStep + 1}: ${step.prefix || "(empty)"}`;
    probabilities.replaceChildren(h("table", null,
      h("thead", null, h("tr", null, ...["Token", "Allowed", "Chance before rules", "Chance after rules"].map(t => h("th", { scope: "col" }, t)))),
      h("tbody", null, ...vocabulary.map((t, i) => h("tr", null, h("td", null, t === step.chosen ? `${t} ← sampled` : t), h("td", null, step.allowed.includes(t) ? "yes" : "no"), h("td", null, fmt(step.before[i]!, 4)), h("td", null, fmt(step.after[i]!, 4))))),
    ));
  }
  function regenerate() {
    sample = generate(options);
    validity.set(`${fmt(200 * validityRate({ ...options, masked: true }), 0)} / ${fmt(200 * validityRate({ ...options, masked: false }), 0)}`);
    drawTrace();
  }
  root.append(
    note("The grammar fixes key order; values are sampled."), h("pre", { style: "white-space:pre-wrap" }, JSON.stringify(schema, null, 2)),
    row(toggle({ label: "follow format rules", value: options.masked, onChange: v => { options.masked = v; regenerate(); } }), slider({ label: "seed", min: 1, max: 1000, step: 1, value: options.seed, onInput: v => { options.seed = v; regenerate(); } }), slider({ label: "temperature", min: 0.2, max: 2, step: 0.1, value: 1, onInput: v => { options.temperature = v; regenerate(); } }), slider({ label: "model noise", min: 0, max: 3, step: 0.1, value: 0.5, onInput: v => { options.noise = v; regenerate(); } }), button("Replay seed", () => { selectedStep = 0; regenerate(); })),
    row(validity), row(result), output, row(stepControl, state), prefix, probabilities,
    note("The model sees the last token; the rules track the field."),
  );
  regenerate();
}

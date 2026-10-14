import { button, h, note, readout, row, select, textInput, toggle } from "../../ui/kit";
import { palette } from "../../ui/plot";
import { parseTurns, render, type Style } from "./template";

const chat = JSON.stringify([
  { role: "system", content: "Answer with units." },
  { role: "user", content: "How far is 3 km in meters?" },
  { role: "assistant", content: "3,000 meters." },
], null, 2);
const tools = JSON.stringify([
  { role: "system", content: "Use the lookup tool when needed." },
  { role: "user", content: "Look up the temperature." },
  { role: "assistant", recipient: "functions.lookup", content: "{}" },
  { role: "tool", name: "functions.lookup", content: "18 C" },
  { role: "assistant", content: "The temperature is 18 C." },
], null, 2);
export function mount(root: HTMLElement) {
  let style: Style = "llama3";
  let assistantOnly = true;
  const stream = h("pre", { style: "white-space:pre-wrap;overflow-wrap:anywhere" });
  const status = h("p", { role: "status" });
  const trained = readout("tokens taught");
  const masked = readout("tokens not taught");
  const editor = textInput({ label: "conversation JSON", value: chat, multiline: true, rows: 12, onInput: draw });
  const picker = select<Style>({ label: "format", value: style, options: [{ value: "llama3", label: "Llama 3 Instruct" }, { value: "harmony", label: "gpt-oss Harmony" }], onChange: v => { style = v; draw(); } });
  function draw() {
    try {
      const pieces = render(parseTurns(editor.value), style, assistantOnly);
      const p = palette();
      stream.replaceChildren(...pieces.map(t => h("span", { title: t.trained ? "training target" : "context only", style: `color:${t.trained ? p.accent : p.muted};${t.trained ? "text-decoration:underline" : ""}` }, t.text)));
      const n = pieces.filter(t => t.trained).length;
      trained.set(n); masked.set(pieces.length - n); status.textContent = "";
    } catch (e) { status.textContent = e instanceof Error ? e.message : String(e); stream.replaceChildren(); trained.set("—"); masked.set("—"); }
  }
  root.append(row(picker, toggle({ label: "train assistant only", value: assistantOnly, onChange: v => { assistantOnly = v; draw(); } }), button("Text example", () => { editor.value = chat; draw(); }), button("Tool example (Harmony)", () => { style = "harmony"; picker.value = style; editor.value = tools; draw(); })), editor.el,
    note("Underlined tokens are training targets; headers are context only."), row(trained, masked), status, stream);
  draw();
}

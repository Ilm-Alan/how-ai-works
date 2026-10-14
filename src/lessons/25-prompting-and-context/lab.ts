import { fmt, h, note, readout, row, select, slider, toggle } from "../../ui/kit";
import { conversation, DEFAULT_PRICES, type Config } from "./cost";

export function mount(root: HTMLElement) {
  const c: Config = { parts: [800, 1200, 6000], history: 1000, user: 200, output: 500, turns: 8, cache: true, boundary: 2, changedPart: -1, changeEvery: 1, gapSeconds: 60, ttlSeconds: 300, minimum: 512, prices: { ...DEFAULT_PRICES }, prefillRate: 5000, cacheRate: 50000, decodeRate: 80 };
  const total = readout("Total cost: cache / no cache");
  const latency = readout("Processing seconds: cache / no cache");
  const savings = readout("Cost saved");
  const prefix = readout("Tokens before breakpoint");
  const table = h("div", { style: "overflow-x:auto" });
  const token = (label: string, value: number, set: (v: number) => void) => slider({ label, min: 0, max: 12000, step: 100, value, onInput: v => { set(v); draw(); } });
  const writePrice = slider({ label: "cache write USD / 1M", min: 0, max: 10, step: 0.05, value: c.prices.write, onInput: v => { c.prices.write = v; draw(); } });
  function draw() {
    const turns = conversation(c);
    const sum = (key: "cost" | "uncachedCost" | "seconds" | "uncachedSeconds") => turns.reduce((s, t) => s + t[key], 0);
    total.set(`$${fmt(sum("cost"), 5)} / $${fmt(sum("uncachedCost"), 5)}`);
    latency.set(`${fmt(sum("seconds"), 2)} / ${fmt(sum("uncachedSeconds"), 2)}`);
    savings.set(`${fmt(100 * (1 - sum("cost") / sum("uncachedCost")), 1)}%`);
    prefix.set(c.parts.slice(0, c.boundary + 1).reduce((s, n) => s + n, 0));
    const headings = ["Turn", "Cache", "Uncached", "Written", "Read", "Cost ($)", "First token (s)"];
    table.replaceChildren(h("table", null,
      h("thead", null, h("tr", null, ...headings.map(x => h("th", { scope: "col" }, x)))),
      h("tbody", null, ...turns.map(t => h("tr", null, ...[t.turn, t.status, t.regular, t.written, t.read, fmt(t.cost, 5), fmt(t.ttft, 2)].map(x => h("td", null, x))))),
    ));
  }
  root.append(
    row(token("tool definitions", c.parts[0], v => c.parts[0] = v), token("system instructions", c.parts[1], v => c.parts[1] = v), token("documents", c.parts[2], v => c.parts[2] = v)),
    row(token("initial history", c.history, v => c.history = v), token("user message each turn", c.user, v => c.user = v), token("output each turn", c.output, v => c.output = v)),
    row(slider({ label: "turns", min: 1, max: 20, step: 1, value: c.turns, onInput: v => { c.turns = v; draw(); } }), toggle({ label: "enable caching", value: true, onChange: v => { c.cache = v; draw(); } }),
      select({ label: "breakpoint after", value: "2", options: [{ value: "0", label: "tools" }, { value: "1", label: "system" }, { value: "2", label: "documents" }], onChange: v => { c.boundary = Number(v) as 0 | 1 | 2; draw(); } }),
      select({ label: "content changed between turns", value: "-1", options: [{ value: "-1", label: "none" }, { value: "0", label: "tools" }, { value: "1", label: "system" }, { value: "2", label: "documents" }, { value: "3", label: "history (suffix only)" }], onChange: v => { c.changedPart = Number(v) as Config["changedPart"]; draw(); } })),
    row(slider({ label: "change every N turns", min: 1, max: 10, step: 1, value: 1, onInput: v => { c.changeEvery = v; draw(); } }), slider({ label: "request gap (seconds)", min: 0, max: 4000, step: 10, value: c.gapSeconds, onInput: v => { c.gapSeconds = v; draw(); } }),
      select({ label: "cache lifetime", value: "300", options: [{ value: "300", label: "5 minutes (write $2.50 default)" }, { value: "3600", label: "1 hour (write $4 default)" }], onChange: v => { c.ttlSeconds = Number(v); c.prices.write = c.ttlSeconds === 300 ? 2.5 : 4; writePrice.value = c.prices.write; draw(); } })),
    row(slider({ label: "input USD / 1M", min: 0, max: 10, step: 0.1, value: 2, onInput: v => { c.prices.input = v; draw(); } }), writePrice, slider({ label: "cache read USD / 1M", min: 0, max: 2, step: 0.01, value: 0.1, onInput: v => { c.prices.read = v; draw(); } }), slider({ label: "output USD / 1M", min: 0, max: 50, step: 0.5, value: 10, onInput: v => { c.prices.output = v; draw(); } })),
    row(slider({ label: "input tokens per second", min: 1000, max: 20000, step: 1000, value: 5000, onInput: v => { c.prefillRate = v; draw(); } }), slider({ label: "cached tokens per second", min: 10000, max: 100000, step: 5000, value: 50000, onInput: v => { c.cacheRate = v; draw(); } }), slider({ label: "output tokens per second", min: 10, max: 200, step: 10, value: 80, onInput: v => { c.decodeRate = v; draw(); } })),
    row(prefix, total, savings), row(latency), table,
    note("Defaults use Claude Sonnet 5.5 prices from October 2026."),
  );
  draw();
}

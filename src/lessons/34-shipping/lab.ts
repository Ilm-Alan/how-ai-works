import { fmt, h, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { type ApiPrice, apiCostPerDay, breakEven, gpusNeeded, type SelfHost, selfHostCostPerDay, type Workload } from "./cost";

const usd = (x: number) => (x >= 100 ? `$${Math.round(x).toLocaleString("en-US")}` : x >= 1 ? `$${x.toFixed(2)}` : `$${x.toPrecision(2)}`);

export function mount(root: HTMLElement) {
  const w: Workload = { requestsPerDay: 50_000, inputTokens: 2000, outputTokens: 400 };
  // Defaults: GPT-6 Luna list price (Sept 2026); gpt-oss-120b on one H100 at 50 tok/s per user (InferenceX);
  // median on-demand H100 rate card, Oct 14 2026 (GPU Economy). All editable.
  const api: ApiPrice = { input: 0.1, output: 0.5 };
  const gpu: SelfHost = { gpuHour: 3.49, tokensPerSecPerGpu: 8973, utilization: 0.4, minGpus: 1 };

  const view = h("div");
  const c = chart(view, { height: 300, x: [3, 8], y: [1, 1e6], logY: true, xLabel: "requests per day (log10)", yLabel: "USD per day" });
  const apiR = readout("API");
  const selfR = readout("self-hosted");
  const gpusR = readout("GPUs");
  const beR = readout("self-hosting breaks even at");
  const perReq = readout("cost per request (API / self-hosted)");

  function draw() {
    const a = apiCostPerDay(w, api);
    const s = selfHostCostPerDay(w, gpu);
    apiR.set(`${usd(a)}/day`);
    selfR.set(`${usd(s)}/day`);
    gpusR.set(String(gpusNeeded(w, gpu)));
    const be = breakEven(w, api, gpu, 1e8);
    beR.set(be === undefined ? "never below 100M requests/day" : `${be.toLocaleString("en-US")} requests/day`);
    perReq.set(`${usd(a / w.requestsPerDay)} / ${usd(s / w.requestsPerDay)}`);

    const xs = Array.from({ length: 201 }, (_, i) => 3 + (i * 5) / 200);
    const at = (lg: number) => ({ ...w, requestsPerDay: Math.round(10 ** lg) });
    c.clear();
    c.line(xs, xs.map((lg) => apiCostPerDay(at(lg), api)), { color: c.pal.accent });
    c.line(xs, xs.map((lg) => selfHostCostPerDay(at(lg), gpu)), { color: c.pal.series[1] });
    c.line([Math.log10(w.requestsPerDay), Math.log10(w.requestsPerDay)], [1, 1e6], { color: c.pal.muted, dashed: true, width: 1 });
    c.legend([
      { label: "API", color: c.pal.accent },
      { label: "self-hosted", color: c.pal.series[1]! },
    ]);
  }

  function num<T extends Record<K, number>, K extends keyof T>(label: string, obj: T, key: K, min: number, max: number, step: number, format?: (v: number) => string) {
    return slider({ label, min, max, step, value: obj[key], format, onInput: (v) => ((obj[key] = v as T[K]), draw()) });
  }

  root.append(
    h("h3", null, "Workload"),
    row(
      slider({
        label: "requests per day",
        min: 3,
        max: 8,
        step: 0.05,
        value: Math.log10(w.requestsPerDay),
        format: (v) => Math.round(10 ** v).toLocaleString("en-US"),
        onInput: (v) => ((w.requestsPerDay = Math.round(10 ** v)), draw()),
      }),
      num("input tokens", w, "inputTokens", 100, 50_000, 100),
      num("output tokens", w, "outputTokens", 10, 5000, 10),
    ),
    h("h3", null, "API price (USD per million tokens)"),
    row(num("input price", api, "input", 0.05, 20, 0.05), num("output price", api, "output", 0.1, 80, 0.1)),
    h("h3", null, "Self-hosting"),
    row(
      num("GPU $/hour", gpu, "gpuHour", 0.5, 15, 0.01),
      num("tokens/s per GPU", gpu, "tokensPerSecPerGpu", 200, 20_000, 100),
      num("busy time", gpu, "utilization", 0.05, 1, 0.05, (v) => `${Math.round(v * 100)}%`),
      num("GPUs per replica", gpu, "minGpus", 1, 16, 1),
    ),
    row(apiR, selfR, gpusR),
    row(perReq),
    row(beR),
    view,
    note(
      "Compare models on your task before comparing their hosting costs.",
    ),
  );
  draw();
}

// Small DOM helpers shared by every lab. Labs compose these instead of hand-rolling controls.

/** Controls returned by `slider`, `select`, etc. can be passed directly as children; their `el` is appended. */
type Child = Node | { el: Node } | string | number | null | undefined | false;
type Attrs = Record<string, string | number | boolean | EventListener | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs | null = null,
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === undefined || v === false) continue;
      if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else if (k === "class") el.className = String(v);
      else el.setAttribute(k, v === true ? "" : String(v));
    }
  }
  append(el, ...children);
  return el;
}

export function append(el: HTMLElement, ...children: Child[]): void {
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === "number" ? String(c) : typeof c === "object" && "el" in c ? c.el : c);
  }
}

export function fmt(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return String(x);
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e6)) return x.toExponential(Math.max(0, digits - 1));
  return Number(x.toFixed(digits)).toString();
}

export interface Slider {
  el: HTMLElement;
  value: number;
}

export function slider(o: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  format?: (v: number) => string;
  /** Map slider position to value, e.g. for log scales. Position is in [min, max]. */
  map?: (pos: number) => number;
  onInput: (v: number) => void;
}): Slider {
  const map = o.map ?? ((p: number) => p);
  const format = o.format ?? ((v: number) => fmt(v));
  const input = h("input", { type: "range", min: o.min, max: o.max, step: o.step, value: o.value });
  const out = h("output", null, format(map(o.value)));
  const el = h("label", { class: "ctl" }, h("span", { class: "ctl-label" }, o.label), input, out);
  const state: Slider = {
    el,
    get value() {
      return map(Number(input.value));
    },
    set value(v: number) {
      input.value = String(v);
      out.textContent = format(map(v));
    },
  };
  input.addEventListener("input", () => {
    const v = map(Number(input.value));
    out.textContent = format(v);
    o.onInput(v);
  });
  return state;
}

export function select<T extends string>(o: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}): { el: HTMLElement; value: T } {
  const sel = h("select", null, ...o.options.map((op) => h("option", { value: op.value }, op.label)));
  sel.value = o.value;
  sel.addEventListener("change", () => o.onChange(sel.value as T));
  const el = h("label", { class: "ctl" }, h("span", { class: "ctl-label" }, o.label), sel);
  return {
    el,
    get value() {
      return sel.value as T;
    },
    set value(v: T) {
      sel.value = v;
    },
  };
}

export function toggle(o: { label: string; value: boolean; onChange: (v: boolean) => void }): {
  el: HTMLElement;
  value: boolean;
} {
  const input = h("input", { type: "checkbox" });
  input.checked = o.value;
  input.addEventListener("change", () => o.onChange(input.checked));
  const el = h("label", { class: "ctl ctl-toggle" }, input, h("span", null, o.label));
  return {
    el,
    get value() {
      return input.checked;
    },
    set value(v: boolean) {
      input.checked = v;
    },
  };
}

export function button(label: string, onClick: () => void, kind: "primary" | "plain" = "plain"): HTMLButtonElement {
  return h("button", { type: "button", class: `btn btn-${kind}`, onclick: () => onClick() }, label);
}

export function textInput(o: {
  label: string;
  value: string;
  multiline?: boolean;
  rows?: number;
  onInput: (v: string) => void;
}): { el: HTMLElement; value: string } {
  const input = o.multiline
    ? h("textarea", { rows: o.rows ?? 4, spellcheck: false })
    : h("input", { type: "text", spellcheck: false });
  input.value = o.value;
  input.addEventListener("input", () => o.onInput(input.value));
  const el = h("label", { class: "ctl ctl-text" }, h("span", { class: "ctl-label" }, o.label), input);
  return {
    el,
    get value() {
      return input.value;
    },
    set value(v: string) {
      input.value = v;
    },
  };
}

/** A labeled live number or string. */
export function readout(label: string, initial = "—"): { el: HTMLElement; set(v: string | number): void } {
  const val = h("span", { class: "readout-value" }, initial);
  const el = h("div", { class: "readout" }, h("span", { class: "readout-label" }, label), val);
  return { el, set: (v) => void (val.textContent = typeof v === "number" ? fmt(v) : v) };
}

/** Horizontal group of controls that wraps. */
export function row(...children: Child[]): HTMLDivElement {
  return h("div", { class: "lab-row" }, ...children);
}

/** Side-by-side columns that stack on narrow screens. */
export function cols(...children: Child[]): HTMLDivElement {
  return h("div", { class: "lab-cols" }, ...children);
}

export function note(text: string): HTMLParagraphElement {
  return h("p", { class: "lab-note" }, text);
}

/**
 * Runs `step` once per animation frame, time-boxed to `budgetMs` of work per frame so training loops stay responsive.
 * `step` returns false to stop. Stops automatically when `root` leaves the document.
 */
export function loop(
  root: HTMLElement,
  step: () => boolean | void,
  budgetMs = 12,
): { start(): void; stop(): void; running: boolean } {
  let raf = 0;
  const ctl = {
    running: false,
    start() {
      if (ctl.running) return;
      ctl.running = true;
      raf = requestAnimationFrame(tick);
    },
    stop() {
      ctl.running = false;
      cancelAnimationFrame(raf);
    },
  };
  function tick() {
    if (!ctl.running) return;
    if (!root.isConnected) return ctl.stop();
    const t0 = performance.now();
    do {
      if (step() === false) return ctl.stop();
    } while (performance.now() - t0 < budgetMs);
    raf = requestAnimationFrame(tick);
  }
  return ctl;
}

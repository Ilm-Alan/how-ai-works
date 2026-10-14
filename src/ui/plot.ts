// Canvas plotting for labs. Colors come from the page theme so charts follow light/dark mode.

import { fmt, h } from "./kit";

// Canvas fonts cannot reference CSS variables.
const MONO = "11px ui-monospace, SFMono-Regular, Menlo, monospace";
const SANS = "system-ui, -apple-system, sans-serif";

export interface Palette {
  fg: string;
  muted: string;
  border: string;
  surface: string;
  accent: string;
  /** Six categorical series colors. */
  series: string[];
}

export function palette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string) => s.getPropertyValue(name).trim();
  return {
    fg: v("--fg"),
    muted: v("--muted"),
    border: v("--border"),
    surface: v("--surface"),
    accent: v("--accent"),
    series: [v("--c1"), v("--c2"), v("--c3"), v("--c4"), v("--c5"), v("--c6")],
  };
}

export interface LineStyle {
  color?: string;
  width?: number;
  dashed?: boolean;
}

export interface PointStyle {
  color?: string;
  /** Per-point colors; overrides `color`. */
  colors?: ArrayLike<string>;
  r?: number;
}

export interface ChartOptions {
  /** CSS pixel height. Width tracks the container. */
  height?: number;
  x: [number, number];
  y: [number, number];
  xLabel?: string;
  yLabel?: string;
  logY?: boolean;
  /** Draw tick labels and gridlines. Default true. */
  axes?: boolean;
  /** Keep 1 unit in x equal to 1 unit in y on screen (for geometry). */
  equalAspect?: boolean;
}

export interface Chart {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  pal: Palette;
  x: [number, number];
  y: [number, number];
  /** Clears the canvas and redraws axes. Call at the start of every frame. */
  clear(): void;
  line(xs: ArrayLike<number>, ys: ArrayLike<number>, style?: LineStyle): void;
  points(xs: ArrayLike<number>, ys: ArrayLike<number>, style?: PointStyle): void;
  /** Arrow from (x0,y0) to (x1,y1) in data coordinates. */
  arrow(x0: number, y0: number, x1: number, y1: number, style?: LineStyle): void;
  text(x: number, y: number, s: string, o?: { color?: string; align?: CanvasTextAlign; size?: number }): void;
  /** Fills each cell of a grid covering the plot area. `value(i, j)` returns a CSS color for column i, row j (row 0 at top). */
  field(nx: number, ny: number, color: (i: number, j: number) => string): void;
  legend(items: { label: string; color: string }[]): void;
  toPx(x: number, y: number): [number, number];
  fromPx(px: number, py: number): [number, number];
  /** Pointer events in data coordinates; `down` is true while a button is held. */
  onPointer(cb: (x: number, y: number, down: boolean, e: PointerEvent) => void): void;
}

const PAD = { l: 44, r: 10, t: 10, b: 30 };

export function chart(parent: HTMLElement, o: ChartOptions): Chart {
  const canvas = h("canvas", { class: "chart" });
  parent.append(canvas);
  const ctx = canvas.getContext("2d")!;
  const height = o.height ?? 260;
  const axes = o.axes ?? true;
  const pad = axes ? PAD : { l: 4, r: 4, t: 4, b: 4 };
  let w = 0;
  let plotW = 0;
  let plotH = 0;
  let offX = 0;
  let offY = 0;

  const ty = (y: number) => (o.logY ? Math.log10(Math.max(y, 1e-30)) : y);
  const yRange = (): [number, number] => [ty(c.y[0]), ty(c.y[1])];

  function size() {
    const dpr = window.devicePixelRatio || 1;
    w = Math.max(200, canvas.parentElement?.clientWidth ?? 600);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${height}px`;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    plotW = w - pad.l - pad.r;
    plotH = height - pad.t - pad.b;
    offX = pad.l;
    offY = pad.t;
    if (o.equalAspect) {
      const sx = plotW / (c.x[1] - c.x[0]);
      const [y0, y1] = yRange();
      const sy = plotH / (y1 - y0);
      const s = Math.min(sx, sy);
      offX = pad.l + (plotW - s * (c.x[1] - c.x[0])) / 2;
      offY = pad.t + (plotH - s * (y1 - y0)) / 2;
      plotW = s * (c.x[1] - c.x[0]);
      plotH = s * (y1 - y0);
    }
  }

  function toPx(x: number, y: number): [number, number] {
    const [y0, y1] = yRange();
    return [offX + ((x - c.x[0]) / (c.x[1] - c.x[0])) * plotW, offY + (1 - (ty(y) - y0) / (y1 - y0)) * plotH];
  }

  function fromPx(px: number, py: number): [number, number] {
    const [y0, y1] = yRange();
    const x = c.x[0] + ((px - offX) / plotW) * (c.x[1] - c.x[0]);
    const yt = y0 + (1 - (py - offY) / plotH) * (y1 - y0);
    return [x, o.logY ? 10 ** yt : yt];
  }

  function ticks(lo: number, hi: number, n: number): number[] {
    const span = hi - lo;
    if (!(span > 0)) return [lo];
    const raw = span / n;
    const mag = 10 ** Math.floor(Math.log10(raw));
    const stepNorm = raw / mag;
    const step = (stepNorm < 1.5 ? 1 : stepNorm < 3.5 ? 2 : stepNorm < 7.5 ? 5 : 10) * mag;
    const out: number[] = [];
    for (let t = Math.ceil(lo / step) * step; t <= hi + step * 1e-9; t += step) out.push(Math.abs(t) < step * 1e-9 ? 0 : t);
    return out;
  }

  function drawAxes() {
    const p = c.pal;
    ctx.font = MONO;
    ctx.lineWidth = 1;
    ctx.strokeStyle = p.border;
    ctx.fillStyle = p.muted;
    if (!axes) return;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    for (const t of ticks(c.x[0], c.x[1], Math.max(2, Math.floor(plotW / 80)))) {
      const [px] = toPx(t, c.y[0]);
      ctx.beginPath();
      ctx.moveTo(px, offY);
      ctx.lineTo(px, offY + plotH);
      ctx.stroke();
      ctx.fillText(fmt(t, 3), px, offY + plotH + 4);
    }
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    const [y0, y1] = yRange();
    for (const t of ticks(y0, y1, Math.max(2, Math.floor(plotH / 50)))) {
      const yv = o.logY ? 10 ** t : t;
      const [, py] = toPx(c.x[0], yv);
      ctx.beginPath();
      ctx.moveTo(offX, py);
      ctx.lineTo(offX + plotW, py);
      ctx.stroke();
      ctx.fillText(o.logY ? `1e${t}` : fmt(t, 3), offX - 4, py);
    }
    if (o.xLabel) {
      ctx.textAlign = "right";
      ctx.textBaseline = "bottom";
      ctx.fillText(o.xLabel, offX + plotW, offY + plotH - 2);
    }
    if (o.yLabel) {
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.fillText(o.yLabel, offX + 4, offY + 2);
    }
  }

  const c: Chart = {
    canvas,
    ctx,
    pal: palette(),
    x: [...o.x],
    y: [...o.y],
    clear() {
      c.pal = palette();
      size();
      ctx.clearRect(0, 0, w, height);
      drawAxes();
    },
    line(xs, ys, s = {}) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(offX, offY, plotW, plotH);
      ctx.clip();
      ctx.strokeStyle = s.color ?? c.pal.accent;
      ctx.lineWidth = s.width ?? 2;
      ctx.setLineDash(s.dashed ? [5, 4] : []);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < ys.length; i++) {
        const yv = ys[i]!;
        if (!Number.isFinite(yv)) {
          started = false;
          continue;
        }
        const [px, py] = toPx(xs[i]!, yv);
        if (started) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
        started = true;
      }
      ctx.stroke();
      ctx.restore();
    },
    points(xs, ys, s = {}) {
      const r = s.r ?? 3;
      ctx.fillStyle = s.color ?? c.pal.accent;
      for (let i = 0; i < xs.length; i++) {
        if (s.colors) ctx.fillStyle = s.colors[i]!;
        const [px, py] = toPx(xs[i]!, ys[i]!);
        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    arrow(x0, y0, x1, y1, s = {}) {
      const [ax, ay] = toPx(x0, y0);
      const [bx, by] = toPx(x1, y1);
      const color = s.color ?? c.pal.fg;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = s.width ?? 2;
      ctx.setLineDash(s.dashed ? [5, 4] : []);
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      const ang = Math.atan2(by - ay, bx - ax);
      const head = 8;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(bx - head * Math.cos(ang - 0.4), by - head * Math.sin(ang - 0.4));
      ctx.lineTo(bx - head * Math.cos(ang + 0.4), by - head * Math.sin(ang + 0.4));
      ctx.closePath();
      ctx.fill();
    },
    text(x, y, s, t = {}) {
      const [px, py] = toPx(x, y);
      ctx.fillStyle = t.color ?? c.pal.fg;
      ctx.font = `${t.size ?? 12}px ${SANS}`;
      ctx.textAlign = t.align ?? "left";
      ctx.textBaseline = "middle";
      ctx.fillText(s, px, py);
    },
    field(nx, ny, color) {
      const cw = plotW / nx;
      const chh = plotH / ny;
      // Snap cell edges to whole pixels so translucent cells neither overlap nor leave gaps.
      for (let j = 0; j < ny; j++) {
        const y0 = Math.round(offY + j * chh);
        const y1 = Math.round(offY + (j + 1) * chh);
        for (let i = 0; i < nx; i++) {
          const x0 = Math.round(offX + i * cw);
          ctx.fillStyle = color(i, j);
          ctx.fillRect(x0, y0, Math.round(offX + (i + 1) * cw) - x0, y1 - y0);
        }
      }
    },
    legend(items) {
      ctx.font = `12px ${SANS}`;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const textW = Math.max(...items.map((it) => ctx.measureText(it.label).width));
      const x = offX + plotW - textW - 24;
      let y = offY + 12;
      for (const it of items) {
        ctx.fillStyle = it.color;
        ctx.fillRect(x, y - 4, 10, 8);
        ctx.fillStyle = c.pal.fg;
        ctx.fillText(it.label, x + 16, y);
        y += 16;
      }
    },
    toPx,
    fromPx,
    onPointer(cb) {
      let down = false;
      const at = (e: PointerEvent) => {
        const r = canvas.getBoundingClientRect();
        const [x, y] = fromPx(e.clientX - r.left, e.clientY - r.top);
        cb(x, y, down, e);
      };
      canvas.addEventListener("pointerdown", (e) => {
        down = true;
        canvas.setPointerCapture(e.pointerId);
        at(e);
      });
      canvas.addEventListener("pointermove", at);
      canvas.addEventListener("pointerup", (e) => {
        down = false;
        at(e);
      });
    },
  };
  size();
  return c;
}

/**
 * Grid of numbers drawn as colored cells, e.g. attention weights or a weight matrix.
 * Diverging scale when `range[0] < 0`, sequential otherwise.
 */
export function heatmap(
  parent: HTMLElement,
  o: { cell?: number; showValues?: boolean },
): {
  el: HTMLElement;
  update(
    data: ArrayLike<number>,
    rows: number,
    cols: number,
    opts?: { range?: [number, number]; rowLabels?: string[]; colLabels?: string[]; highlight?: [number, number] },
  ): void;
} {
  const canvas = h("canvas", { class: "heatmap" });
  parent.append(canvas);
  const ctx = canvas.getContext("2d")!;
  return {
    el: canvas,
    update(data, rows, cols, opts = {}) {
      const pal = palette();
      const cell = o.cell ?? 28;
      const labW = opts.rowLabels ? 8 + 7 * Math.max(...opts.rowLabels.map((s) => s.length)) : 0;
      const labH = opts.colLabels ? 8 + 7 * Math.max(...opts.colLabels.map((s) => s.length)) : 0;
      const w = labW + cols * cell;
      const hh = labH + rows * cell;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(hh * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${hh}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, hh);
      let lo = Infinity;
      let hi = -Infinity;
      for (let i = 0; i < rows * cols; i++) {
        lo = Math.min(lo, data[i]!);
        hi = Math.max(hi, data[i]!);
      }
      const [r0, r1] = opts.range ?? [lo, hi];
      const diverging = r0 < 0;
      const m = Math.max(Math.abs(r0), Math.abs(r1)) || 1;
      ctx.font = MONO;
      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const v = data[i * cols + j]!;
          const t = diverging ? Math.max(-1, Math.min(1, v / m)) : Math.max(0, Math.min(1, (v - r0) / (r1 - r0 || 1)));
          ctx.fillStyle = diverging ? mix(t >= 0 ? pal.series[0]! : pal.series[1]!, Math.abs(t)) : mix(pal.accent, t);
          ctx.fillRect(labW + j * cell, labH + i * cell, cell - 1, cell - 1);
          if (o.showValues) {
            ctx.fillStyle = Math.abs(t) > 0.6 ? pal.surface : pal.fg;
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(fmt(v, 2), labW + j * cell + cell / 2, labH + i * cell + cell / 2);
          }
        }
      }
      if (opts.highlight) {
        const [hi0, hj0] = opts.highlight;
        ctx.strokeStyle = pal.fg;
        ctx.lineWidth = 2;
        ctx.strokeRect(labW + hj0 * cell, labH + hi0 * cell, cell - 1, cell - 1);
      }
      ctx.fillStyle = pal.muted;
      if (opts.rowLabels) {
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        opts.rowLabels.forEach((s, i) => ctx.fillText(s, labW - 4, labH + i * cell + cell / 2));
      }
      if (opts.colLabels) {
        ctx.save();
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        opts.colLabels.forEach((s, j) => {
          ctx.save();
          ctx.translate(labW + j * cell + cell / 2, labH - 4);
          ctx.rotate(-Math.PI / 2);
          ctx.fillText(s, 0, 0);
          ctx.restore();
        });
        ctx.restore();
      }
    },
  };
}

/** `color` (a `#rrggbb` theme color) at opacity `t` in [0,1]. Canvas does not resolve `color-mix`, so this builds rgba directly. */
export function mix(color: string, t: number): string {
  const n = Number.parseInt(color.replace("#", ""), 16);
  const a = Math.max(0, Math.min(1, t));
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

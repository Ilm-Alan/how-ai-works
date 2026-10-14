import { fmt, h, note, readout, row, select, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { series } from "./data";
import { bandHalfWidth, doublingDays, fitExp, yearOf } from "./trend";

function show(id: string, v: number): string {
  if (id !== "metr") return `${v.toExponential(1)} FLOP`;
  if (v < 60) return `${fmt(v, 2)} min`;
  if (v < 60 * 24 * 3) return `${fmt(v / 60, 2)} hours`;
  return `${fmt(v / 60 / 24, 2)} days`;
}

export function mount(root: HTMLElement) {
  let sid = series[0]!.id;
  let from = 2023;
  let to = 2028;
  const view = h("div");
  const c = chart(view, { height: 340, x: [2018, 2030], y: [0.05, 1e5], logY: true });
  const doubling = readout("doubling time");
  const perYear = readout("growth per year");
  const projected = readout("projection");
  const used = readout("data points used");

  function draw() {
    const s = series.find((x) => x.id === sid)!;
    const pts = s.points.map(([d, name, v]) => ({ t: yearOf(d), name, v, ok: !s.reliableMax || v <= s.reliableMax }));
    const fitPts = pts.filter((p) => p.t >= from && p.ok);
    const vals = pts.map((p) => p.v);
    c.x = [Math.floor(Math.min(...pts.map((p) => p.t))), to + 0.5];
    c.y = [Math.min(...vals) / 3, Math.max(...vals) * 1e3];
    c.clear();
    const pal = c.pal;
    if (s.reliableMax) {
      c.line(c.x, [s.reliableMax, s.reliableMax], { color: pal.series[1], dashed: true, width: 1 });
      c.text(c.x[0] + 0.1, s.reliableMax * 1.6, "16 hours: estimates become unreliable", { color: pal.series[1], size: 11 });
    }
    if (fitPts.length >= 3) {
      const f = fitExp(fitPts.map((p) => p.t), fitPts.map((p) => p.v));
      const lastT = Math.max(...fitPts.map((p) => p.t));
      const ts = Array.from({ length: 60 }, (_, i) => from + ((to - from) * i) / 59);
      const at = (t: number) => 10 ** (f.a + f.b * t);
      c.line(ts.filter((t) => t <= lastT), ts.filter((t) => t <= lastT).map(at), { color: pal.accent });
      const ext = ts.filter((t) => t >= lastT);
      c.line(ext, ext.map(at), { color: pal.accent, dashed: true });
      c.line(ext, ext.map((t) => at(t) * 10 ** bandHalfWidth(f, t)), { color: pal.muted, dashed: true, width: 1 });
      c.line(ext, ext.map((t) => at(t) / 10 ** bandHalfWidth(f, t)), { color: pal.muted, dashed: true, width: 1 });
      const band = 10 ** bandHalfWidth(f, to);
      doubling.set(`${fmt(doublingDays(f), 3)} days`);
      perYear.set(`×${fmt(10 ** f.b, 3)}`);
      projected.set(`${show(sid, at(to))} in ${to} (95% band ÷/× ${fmt(band, 2)})`);
      used.set(`${fitPts.length} of ${pts.length}`);
    } else {
      for (const r of [doubling, perYear, projected]) r.set("need ≥ 3 points");
      used.set(`${fitPts.length} of ${pts.length}`);
    }
    c.points(pts.filter((p) => p.ok && p.t >= from).map((p) => p.t), pts.filter((p) => p.ok && p.t >= from).map((p) => p.v), { color: pal.fg, r: 4 });
    c.points(pts.filter((p) => !p.ok || p.t < from).map((p) => p.t), pts.filter((p) => !p.ok || p.t < from).map((p) => p.v), { color: pal.muted, r: 3 });
    const last = pts[pts.length - 1]!;
    c.text(last.t, last.v * 2.2, last.name, { align: "right", size: 11, color: pal.muted });
    srcNote.replaceChildren("Source: ", h("a", { href: s.source.url, target: "_blank", rel: "noopener" }, s.source.label), `. Unit: ${s.unit}. Gray points are excluded from the fit.`);
  }

  const srcNote = note("");
  root.append(
    row(
      select({
        label: "series",
        options: series.map((s) => ({ value: s.id, label: s.label })),
        value: sid,
        onChange: (v) => ((sid = v), draw()),
      }),
    ),
    row(
      slider({ label: "fit data from", min: 2018, max: 2025, step: 1, value: from, onInput: (v) => ((from = v), draw()) }),
      slider({ label: "project to", min: 2026, max: 2030, step: 1, value: to, onInput: (v) => ((to = v), draw()) }),
    ),
    row(doubling, perYear, used),
    row(projected),
    view,
    srcNote,
  );
  draw();
}

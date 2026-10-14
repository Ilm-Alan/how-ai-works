import { fmt, h, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { majorityAccuracy, bestOfAccuracy } from "./voting";
export function mount(root: HTMLElement) {
  let p = 0.4; let wrong = 2; let verifier = 0.8; let n = 9;
  const view = h("div"); const c = chart(view, { x: [1, 31], y: [0, 1], xLabel: "number of tries", yLabel: "chance the final answer is right" });
  const vote = readout("majority vote"); const best = readout("checker"); const threshold = readout("voting helps only if right-answer chance >");
  function draw() {
    const ns = Array.from({ length: 16 }, (_, i) => 2 * i + 1);
    const votes = ns.map(k => majorityAccuracy(p, wrong, k)); const selected = ns.map(k => bestOfAccuracy(p, verifier, k));
    c.clear(); c.line(ns, ns.map(() => p), { color: c.pal.muted, dashed: true }); c.line(ns, votes, { color: c.pal.accent }); c.line(ns, selected, { color: c.pal.series[1] }); c.line([n, n], [0, 1], { color: c.pal.border });
    c.legend([{ label: "one try", color: c.pal.muted }, { label: "majority vote", color: c.pal.accent }, { label: "checker", color: c.pal.series[1]! }]);
    vote.set(`${fmt(100 * majorityAccuracy(p, wrong, n), 2)}%`); best.set(`${fmt(100 * bestOfAccuracy(p, verifier, n), 2)}%`); threshold.set(fmt(1 / (wrong + 1)));
  }
  root.append(row(slider({ label: "chance one try is right", min: 0, max: 1, step: 0.01, value: p, onInput: v => { p = v; draw(); } }), slider({ label: "different wrong answers", min: 1, max: 6, step: 1, value: wrong, onInput: v => { wrong = v; draw(); } }), slider({ label: "checker accuracy", min: 0, max: 1, step: 0.01, value: verifier, onInput: v => { verifier = v; draw(); } }), slider({ label: "tries", min: 1, max: 31, step: 2, value: n, onInput: v => { n = v; draw(); } })), row(vote, best, threshold), view,
    note("Wrong answers are equally likely. The checker keeps one answer it passes, picked at random."));
  draw();
}

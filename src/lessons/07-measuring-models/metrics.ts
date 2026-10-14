export interface Confusion {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

/** Predict positive when score >= threshold. */
export function confusion(scores: ArrayLike<number>, labels: ArrayLike<number>, threshold: number): Confusion {
  const c = { tp: 0, fp: 0, tn: 0, fn: 0 };
  for (let i = 0; i < scores.length; i++) {
    const pos = scores[i]! >= threshold;
    if (labels[i]) pos ? c.tp++ : c.fn++;
    else pos ? c.fp++ : c.tn++;
  }
  return c;
}

export function summarize(c: Confusion) {
  const n = c.tp + c.fp + c.tn + c.fn;
  const accuracy = (c.tp + c.tn) / n;
  const precision = c.tp + c.fp ? c.tp / (c.tp + c.fp) : NaN;
  const recall = c.tp + c.fn ? c.tp / (c.tp + c.fn) : NaN;
  const fpr = c.fp + c.tn ? c.fp / (c.fp + c.tn) : NaN;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : NaN;
  return { n, accuracy, precision, recall, fpr, f1 };
}

/** ROC curve points (FPR, TPR) from the highest threshold down, and the area under it. */
export function roc(scores: ArrayLike<number>, labels: ArrayLike<number>): { fpr: number[]; tpr: number[]; auc: number } {
  const idx = Array.from({ length: scores.length }, (_, i) => i).sort((a, b) => scores[b]! - scores[a]!);
  let P = 0;
  for (let i = 0; i < labels.length; i++) P += labels[i] ? 1 : 0;
  const N = labels.length - P;
  const fpr = [0];
  const tpr = [0];
  let tp = 0;
  let fp = 0;
  let auc = 0;
  for (let k = 0; k < idx.length; k++) {
    const i = idx[k]!;
    if (labels[i]) tp++;
    else fp++;
    // Emit a point only after the last of a run of tied scores.
    if (k + 1 < idx.length && scores[idx[k + 1]!] === scores[i]) continue;
    const x = fp / N;
    const y = tp / P;
    auc += (x - fpr[fpr.length - 1]!) * (y + tpr[tpr.length - 1]!) / 2;
    fpr.push(x);
    tpr.push(y);
  }
  return { fpr, tpr, auc };
}

/** Half-width of the normal-approximation 95% confidence interval for a proportion p measured on n items. */
export function ci95(p: number, n: number): number {
  return 1.96 * Math.sqrt((p * (1 - p)) / n);
}

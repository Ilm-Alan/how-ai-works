function binomial(n: number, p: number): number[] {
  const a = Array<number>(n + 1).fill(0); a[0] = 1;
  for (let t = 0; t < n; t++) for (let k = t + 1; k >= 0; k--) a[k] = (a[k] ?? 0) * (1 - p) + (k > 0 ? a[k - 1]! * p : 0);
  return a;
}
/** Exact multinomial plurality accuracy, uniformly breaking ties between answer labels. */
export function majorityAccuracy(p: number, wrongAnswers: number, n: number): number {
  if (p < 0 || p > 1 || !Number.isInteger(n) || n < 1 || !Number.isInteger(wrongAnswers) || wrongAnswers < 1) throw new Error("Invalid vote parameters.");
  const correct = binomial(n, p); const invFact = [1]; const fact = [1];
  for (let i = 1; i <= n; i++) { fact[i] = fact[i - 1]! * i; invFact[i] = 1 / fact[i]!; }
  let accuracy = 0;
  for (let k = 1; k <= n; k++) {
    const m = n - k;
    // Exponential generating-function coefficients for wrong-label occupancies <= k.
    let dp = Array.from({ length: m + 1 }, () => Array<number>(wrongAnswers + 1).fill(0)); dp[0]![0] = 1;
    for (let label = 0; label < wrongAnswers; label++) {
      const next = Array.from({ length: m + 1 }, () => Array<number>(wrongAnswers + 1).fill(0));
      for (let used = 0; used <= m; used++) for (let ties = 0; ties <= label; ties++) {
        const weight = dp[used]![ties]!; if (weight === 0) continue;
        for (let count = 0; count <= Math.min(k, m - used); count++) next[used + count]![ties + (count === k ? 1 : 0)]! += weight * invFact[count]!;
      }
      dp = next;
    }
    const win = dp[m]!.reduce((s, weight, ties) => s + weight / (ties + 1), 0) * fact[m]! / wrongAnswers ** m;
    accuracy += correct[k]! * win;
  }
  return accuracy;
}
/** Binary verifier: sensitivity=specificity=v; pick uniformly among positive scores, otherwise all samples. */
export function bestOfAccuracy(p: number, v: number, n: number): number {
  if (p < 0 || p > 1 || v < 0 || v > 1 || !Number.isInteger(n) || n < 1) throw new Error("Invalid verifier parameters.");
  const counts = binomial(n, p); let accuracy = 0;
  for (let k = 0; k <= n; k++) {
    const tp = binomial(k, v); const fp = binomial(n - k, 1 - v);
    for (let a = 0; a <= k; a++) for (let b = 0; b <= n - k; b++) accuracy += counts[k]! * tp[a]! * fp[b]! * (a + b > 0 ? a / (a + b) : k / n);
  }
  return accuracy;
}

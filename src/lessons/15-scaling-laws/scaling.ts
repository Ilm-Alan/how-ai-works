// Chinchilla parametric loss L(N, D) = E + A/N^α + B/D^β, N and D as raw counts.
// Constants are Besiroglu et al.'s 2024 refit of Hoffmann et al.'s data (eq. 3); the originally published
// constants (E 1.69, A 406.4, B 410.7, α 0.34, β 0.28) disagree with the paper's own other two methods.
export const FIT = { E: 1.8172, A: 482.01, B: 2085.43, alpha: 0.3478, beta: 0.3658 } as const;

export function loss(parameters: number, tokens: number): number {
  return FIT.E + FIT.A / parameters ** FIT.alpha + FIT.B / tokens ** FIT.beta;
}

/** Loss-minimizing split of training compute C ≈ 6ND. */
export function optimal(compute: number): { parameters: number; tokens: number } {
  const { A, B, alpha, beta } = FIT;
  const g = ((alpha * A) / (beta * B)) ** (1 / (alpha + beta));
  const parameters = g * (compute / 6) ** (beta / (alpha + beta));
  return { parameters, tokens: compute / (6 * parameters) };
}

export function allocation(compute: number, sizeRelativeToOptimum: number) {
  const parameters = optimal(compute).parameters * sizeRelativeToOptimum;
  const tokens = compute / (6 * parameters);
  return { parameters, tokens, loss: loss(parameters, tokens), inferenceFlops: 2 * parameters };
}

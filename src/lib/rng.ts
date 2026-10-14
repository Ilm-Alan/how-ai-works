export interface Rng {
  next(): number;
  normal(): number;
  int(n: number): number;
  shuffle<T>(a: T[]): T[];
}

/** Deterministic mulberry32, with a cached Box–Muller normal sample. */
export function rng(seed: number): Rng {
  let state = seed >>> 0;
  let spare: number | undefined;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), state | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    normal(): number {
      if (spare !== undefined) {
        const value = spare;
        spare = undefined;
        return value;
      }
      // 1 - next() never reaches zero, avoiding log(0).
      const radius = Math.sqrt(-2 * Math.log(1 - next()));
      const angle = 2 * Math.PI * next();
      spare = radius * Math.sin(angle);
      return radius * Math.cos(angle);
    },
    int(n: number): number {
      if (!Number.isSafeInteger(n) || n <= 0) throw new Error("n must be a positive integer");
      return Math.floor(next() * n);
    },
    shuffle<T>(a: T[]): T[] {
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const value = a[i]!;
        a[i] = a[j]!;
        a[j] = value;
      }
      return a;
    },
  };
}

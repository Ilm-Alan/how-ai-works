// Weight quantizers for real formats. Each returns the dequantized values so error can be measured directly.

/** Non-negative representable magnitudes in encoding order, so index parity equals mantissa LSB (for ties-to-even). */
function fpTable(expBits: number, manBits: number, bias: number, drop: (e: number, m: number) => boolean): number[] {
  const out: number[] = [];
  for (let e = 0; e < 2 ** expBits; e++) {
    for (let m = 0; m < 2 ** manBits; m++) {
      if (drop(e, m)) continue;
      const frac = m / 2 ** manBits;
      out.push(e === 0 ? frac * 2 ** (1 - bias) : (1 + frac) * 2 ** (e - bias));
    }
  }
  return out;
}

/** FP4 E2M1 (OCP MX): ±{0, 0.5, 1, 1.5, 2, 3, 4, 6}. No infinities or NaN. */
export const E2M1 = fpTable(2, 1, 1, () => false);
/** FP8 E4M3 (OCP / NVIDIA "FN" variant): max 448, the all-ones pattern is NaN, no infinities. */
export const E4M3 = fpTable(4, 3, 7, (e, m) => e === 15 && m === 7);

/** Round |x| to the nearest table value, ties to even encoding, saturating at the max. */
export function roundTo(table: number[], x: number): number {
  const a = Math.abs(x);
  const max = table[table.length - 1]!;
  if (a >= max) return Math.sign(x) * max;
  let lo = 0;
  let hi = table.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (table[mid]! <= a) lo = mid;
    else hi = mid;
  }
  const dl = a - table[lo]!;
  const dh = table[hi]! - a;
  const pick = dl < dh ? lo : dh < dl ? hi : lo % 2 === 0 ? lo : hi;
  return Math.sign(x) * table[pick]!;
}

export type Format = "int8" | "int4" | "fp8" | "fp4" | "mxfp4" | "nvfp4";
export type Granularity = "tensor" | "row" | 128 | 32 | 16;

export const FORMATS: Record<Format, { label: string; bits: number }> = {
  int8: { label: "INT8", bits: 8 },
  int4: { label: "INT4", bits: 4 },
  fp8: { label: "FP8 E4M3", bits: 8 },
  fp4: { label: "FP4 E2M1", bits: 4 },
  mxfp4: { label: "MXFP4 (32-blocks, power-of-two scale)", bits: 4 },
  nvfp4: { label: "NVFP4 (16-blocks, FP8 scale)", bits: 4 },
};

/** Groups of `cols`-wide rows that share one scale. MX and NV formats fix their own block size. */
function groupSize(format: Format, g: Granularity, n: number, cols: number): number {
  if (format === "mxfp4") return 32;
  if (format === "nvfp4") return 16;
  return g === "tensor" ? n : g === "row" ? cols : g;
}

export interface Result {
  deq: Float32Array;
  /** Average stored bits per weight including scales (FP16 scales, as in common INT4 schemes, unless the format defines its own). */
  bitsPerWeight: number;
}

export function quantize(w: Float32Array, cols: number, format: Format, g: Granularity): Result {
  const n = w.length;
  const size = groupSize(format, g, n, cols);
  const deq = new Float32Array(n);
  let tensorAmax = 0;
  for (let i = 0; i < n; i++) tensorAmax = Math.max(tensorAmax, Math.abs(w[i]!));
  // NVFP4 second-level scale keeps block scales inside E4M3 range.
  const nvGlobal = tensorAmax / (6 * 448) || 1;

  for (let start = 0; start < n; start += size) {
    const end = Math.min(n, start + size);
    let amax = 0;
    for (let i = start; i < end; i++) amax = Math.max(amax, Math.abs(w[i]!));
    if (amax === 0) continue;
    let scale: number;
    let q: (x: number) => number;
    switch (format) {
      case "int8":
      case "int4": {
        const levels = format === "int8" ? 127 : 7;
        scale = amax / levels;
        q = (x) => Math.max(-levels, Math.min(levels, Math.round(x)));
        break;
      }
      case "fp8":
        scale = amax / 448;
        q = (x) => roundTo(E4M3, x);
        break;
      case "fp4":
        scale = amax / 6;
        q = (x) => roundTo(E2M1, x);
        break;
      case "mxfp4":
        // OCP MX: shared scale 2^(floor(log2 amax) − emax_elem), emax for E2M1 is 2.
        scale = 2 ** (Math.floor(Math.log2(amax)) - 2);
        q = (x) => roundTo(E2M1, x);
        break;
      case "nvfp4":
        scale = roundTo(E4M3, amax / 6 / nvGlobal) * nvGlobal;
        q = (x) => roundTo(E2M1, x);
        break;
    }
    for (let i = start; i < end; i++) deq[i] = q(w[i]! / scale) * scale;
  }

  const scaleBits = format === "mxfp4" || format === "nvfp4" ? 8 : 16;
  return { deq, bitsPerWeight: FORMATS[format].bits + scaleBits / size };
}

export function errorStats(w: Float32Array, deq: Float32Array) {
  let se = 0;
  let sw = 0;
  let max = 0;
  let zeroed = 0;
  for (let i = 0; i < w.length; i++) {
    const e = deq[i]! - w[i]!;
    se += e * e;
    sw += w[i]! * w[i]!;
    max = Math.max(max, Math.abs(e));
    if (deq[i] === 0 && w[i] !== 0) zeroed++;
  }
  return { relRmse: Math.sqrt(se / sw), sqnrDb: 10 * Math.log10(sw / se), maxErr: max, zeroed: zeroed / w.length };
}

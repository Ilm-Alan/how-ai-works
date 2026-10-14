export function ridgePoint(peakFlops: number, bandwidthBytes: number): number {
  return peakFlops / bandwidthBytes;
}

/** Optimistic C=AB: read A and B once, write C once; FMA counts as two FLOPs. */
export function matmulIntensity(n: number, bytesPerValue: number): number {
  return 2 * n / (3 * bytesPerValue);
}

/** One addition, two input reads and one output write. */
export function addIntensity(bytesPerValue: number): number {
  return 1 / (3 * bytesPerValue);
}

/** Weight-dominated dense decode: one shared weight read for B output tokens. */
export function decodeIntensity(batch: number, bytesPerWeight: number): number {
  return 2 * batch / bytesPerWeight;
}

export function roofline(peakFlops: number, bandwidthBytes: number, intensity: number): number {
  return Math.min(peakFlops, bandwidthBytes * intensity);
}

export type Storage = "fp32" | "bf16" | "fp16" | "fp8" | "fp4" | "mxfp4" | "nvfp4";
export const storageBytes: Record<Storage, number> = {
  fp32: 4, bf16: 2, fp16: 2, fp8: 1, fp4: 0.5, mxfp4: 4.25 / 8, nvfp4: 4.5 / 8,
};

/** Storage lower bound; excludes activations, cache, padding, and tensor-scale metadata. */
export function modelMemory(params: number, format: Storage, training: boolean): number {
  // Conventional Adam mixed precision: 2 weight + 2 gradient + 4 master + 8 moments.
  return params * (training ? 16 : storageBytes[format]);
}

export function minimumDevices(bytes: number, capacityBytes: number): number {
  return Math.ceil(bytes / capacityBytes);
}

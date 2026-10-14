export type Precision = "bf16" | "fp8" | "fp4";

export const sources = [
  { label: "NVIDIA H100 specifications (sparse rates divided by two; accessed October 2026)", url: "https://www.nvidia.com/en-us/data-center/h100/" },
  { label: "NVIDIA HGX: B200/B300 dense rates and preliminary Rubin specifications (October 2026)", url: "https://www.nvidia.com/en-us/data-center/hgx/" },
  { label: "NVIDIA HGX reference architecture: nominal B200/B300 HBM capacity and bandwidth (May 2026)", url: "https://docs.nvidia.com/enterprise-reference-architectures/hgx-ai-factory/latest/components.html" },
  { label: "NVIDIA GB300 NVL72: rack rates normalized per GPU (accessed October 2026)", url: "https://www.nvidia.com/en-us/data-center/gb300-nvl72/" },
  { label: "AMD MI355X: dense matrix rates, HBM capacity and bandwidth (accessed October 2026)", url: "https://www.amd.com/en/products/accelerators/instinct/mi350/mi355x.html" },
  { label: "Google TPU7x Ironwood: per-chip BF16/FP8 and HBM specifications (October 9, 2026)", url: "https://docs.cloud.google.com/tpu/docs/tpu7x" },
  { label: "NVIDIA TensorRT: FP16/BF16 bit fields, range and numerical accuracy", url: "https://docs.nvidia.com/deeplearning/tensorrt/latest/inference-library/accuracy-considerations.html" },
  { label: "NVIDIA: FP8 formats and mixed-precision training (June 2025)", url: "https://developer.nvidia.com/blog/floating-point-8-an-introduction-to-efficient-lower-precision-ai-training/" },
  { label: "OCP Microscaling Formats specification 1.0: FP8/FP4 encodings and MXFP4 storage", url: "https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf" },
  { label: "NVIDIA: NVFP4, FP32 E8M23 and storage overhead (updated January 2026)", url: "https://developer.nvidia.com/blog/introducing-nvfp4-for-efficient-and-accurate-low-precision-inference/" },
  { label: "NVIDIA: mixed-precision training and arithmetic intensity", url: "https://docs.nvidia.com/deeplearning/performance/mixed-precision-training/index.html" },
  { label: "NVIDIA: Pretraining Large Language Models with NVFP4 (September 2025)", url: "https://arxiv.org/html/2509.25149v1" },
];

export interface Accelerator {
  id: string;
  label: string;
  // Decimal TFLOP/s and TB/s; nominal capacity converted to decimal GB.
  peak: Partial<Record<Precision, number>>;
  bandwidth: number;
  capacity: number;
  sourceIndices: number[];
  caveat: string;
}

export const accelerators: Accelerator[] = [
  { id: "h100", label: "H100 SXM", peak: { bf16: 1979 / 2, fp8: 3958 / 2 }, bandwidth: 3.35, capacity: 80, sourceIndices: [0], caveat: "Dense rates are half the advertised sparse Tensor Core rates. No native FP4 rate listed." },
  { id: "b200", label: "B200 SXM", peak: { bf16: 36000 / 2 / 8, fp8: 72000 / 2 / 8, fp4: 72000 / 8 }, bandwidth: 8, capacity: 180, sourceIndices: [1, 2], caveat: "HGX rates divided by eight GPUs; BF16/FP8 sparse rates additionally divided by two." },
  { id: "b300", label: "B300 SXM", peak: { bf16: 36000 / 2 / 8, fp8: 72000 / 2 / 8, fp4: 108000 / 8 }, bandwidth: 8, capacity: 288, sourceIndices: [1, 2], caveat: "HGX dense rates divided by eight GPUs. Capacity is nominal HBM; usable capacity can be lower." },
  { id: "gb300", label: "GB300 NVL72 — one GPU", peak: { bf16: 360000 / 2 / 72, fp8: 720000 / 2 / 72, fp4: 1080000 / 72 }, bandwidth: 576 / 72, capacity: 288, sourceIndices: [2, 3], caveat: "Rack rates divided by 72 GPUs; BF16/FP8 sparse rates divided by two. This is not the whole rack or the CPU+two-GPU Superchip." },
  { id: "mi355x", label: "AMD MI355X", peak: { bf16: 2500, fp8: 5000, fp4: 10100 }, bandwidth: 8, capacity: 288, sourceIndices: [4], caveat: "Vendor dense BF16/OCP-FP8/MXFP4 matrix peaks, not measured application throughput." },
  { id: "ironwood", label: "TPU7x Ironwood — one chip", peak: { bf16: 2307, fp8: 4614 }, bandwidth: 7.38, capacity: 192 * 2 ** 30 / 1e9, sourceIndices: [5], caveat: "Uses the specification table's 192 GiB and 7380 GB/s; prose on the same page rounds these differently. No FP4 peak published there." },
  { id: "rubin", label: "Rubin — preliminary", peak: { bf16: 4000, fp8: 17500, fp4: 35000 }, bandwidth: 22, capacity: 288, sourceIndices: [1], caveat: "Preliminary, up-to specifications subject to change. FP4 uses the published dense training peak, not the sparse inference headline." },
];

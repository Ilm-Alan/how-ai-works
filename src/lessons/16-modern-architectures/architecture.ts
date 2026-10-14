export type Attention = "mha" | "gqa" | "mla" | "window";
export interface CacheConfig {
  attention: Attention;
  layers: number;
  heads: number;
  kvHeads: number;
  headDim: number;
  latentDim: number;
  ropeDim: number;
  bytes: number;
  context: number;
  window: number;
  globalLayers: number;
}

export function cache(c: CacheConfig) {
  const scalarsPerLayer = c.attention === "mla" ? c.latentDim + c.ropeDim :
    2 * (c.attention === "mha" ? c.heads : c.kvHeads) * c.headDim;
  const bytesPerToken = c.layers * scalarsPerLayer * c.bytes;
  const layerTokens = c.attention === "window" ?
    c.globalLayers * c.context + (c.layers - c.globalLayers) * Math.min(c.context, c.window) :
    c.layers * c.context;
  return { bytesPerToken, sequenceBytes: layerTokens * scalarsPerLayer * c.bytes };
}

export interface MoeConfig { experts: number; topK: number; expertParameters: number; sharedParameters: number }
export function moe(c: MoeConfig) {
  return {
    total: c.sharedParameters + c.experts * c.expertParameters,
    active: c.sharedParameters + c.topK * c.expertParameters,
    matmulFlops: 2 * (c.sharedParameters + c.topK * c.expertParameters),
  };
}

// Historical published configs; cache precision here is an explicit BF16 assumption.
export const QWEN_32B: CacheConfig = {
  attention: "gqa", layers: 64, heads: 40, kvHeads: 8, headDim: 128,
  latentDim: 512, ropeDim: 64, bytes: 2, context: 32768, window: 4096, globalLayers: 0,
};
export const DEEPSEEK_V3: CacheConfig = {
  attention: "mla", layers: 61, heads: 128, kvHeads: 128, headDim: 128,
  latentDim: 512, ropeDim: 64, bytes: 2, context: 32768, window: 4096, globalLayers: 0,
};

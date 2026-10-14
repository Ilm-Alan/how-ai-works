import { expect, test } from "bun:test";
import { cache, DEEPSEEK_V3, moe, QWEN_32B } from "./architecture";

test("Qwen2.5-32B: eight KV heads, 128 dimensions, 64 layers", () => {
  const g = cache(QWEN_32B);
  expect(g.bytesPerToken).toBe(262144);
  expect(g.sequenceBytes).toBe(8 * 2 ** 30);
  const m = cache({ ...QWEN_32B, attention: "mha" });
  expect(m.bytesPerToken / g.bytesPerToken).toBe(5);
});

test("DeepSeek-V3 MLA stores joint latent plus decoupled RoPE key, not two latents", () => {
  const m = cache(DEEPSEEK_V3);
  expect(m.bytesPerToken).toBe(61 * (512 + 64) * 2);
  expect(m.bytesPerToken).toBe(70272);
  expect(m.sequenceBytes).toBe(2302672896);
  expect(cache({ ...DEEPSEEK_V3, heads: 256 }).bytesPerToken).toBe(m.bytesPerToken);
});

test("GQA becomes MHA when every query head has a KV head", () => {
  expect(cache({ ...QWEN_32B, kvHeads: 40 })).toEqual(cache({ ...QWEN_32B, attention: "mha" }));
});

test("sliding cache saturates locally; global layers keep growing", () => {
  const c = { ...QWEN_32B, attention: "window" as const, window: 4096 };
  expect(cache({ ...c, context: 1024 }).sequenceBytes).toBe(cache({ ...QWEN_32B, context: 1024 }).sequenceBytes);
  expect(cache(c).sequenceBytes).toBe(cache({ ...c, context: 65536 }).sequenceBytes);
  expect(cache({ ...c, globalLayers: 16 }).sequenceBytes).toBe(4096 * (16 * 32768 + 48 * 4096));
  expect(cache({ ...c, globalLayers: 64 })).toEqual(cache(QWEN_32B));
  expect(cache({ ...c, context: 0 }).sequenceBytes).toBe(0);
});

test("MoE counts shared weights once and separates active from resident", () => {
  expect(moe({ experts: 8, topK: 2, expertParameters: 100, sharedParameters: 50 }))
    .toEqual({ total: 850, active: 250, matmulFlops: 500 });
  const all = moe({ experts: 8, topK: 8, expertParameters: 100, sharedParameters: 50 });
  expect(all.active).toBe(all.total);
});

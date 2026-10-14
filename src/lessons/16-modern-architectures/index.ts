import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "modern-architectures",
  title: "Modern architectures",
  part: "language-models",
  body,
  lab: { title: "Weights used, state stored", mount },
  quiz: [
    { q: "You double the experts but still choose four per token. Each expert stays the same size. What changes?", choices: ["Work doubles, storage stays fixed", "Expert storage doubles, expert work stays fixed", "Neither changes", "The cache doubles"], answer: 1, why: "You store every expert, but each token still uses only four." },
    { q: "Forty query heads share eight sets of keys and values. How much cache do they need compared with forty separate sets?", choices: ["One fifth", "Five times as much", "The same", "One fortieth"], answer: 0, why: "Eight shared sets use one fifth the storage of forty separate sets." },
    { q: "A layer stores 512 values for a joint summary and 64 for position, at two bytes each. How many bytes is that?", choices: ["2,176", "1,024", "128", "1,152"], answer: 3, why: "The joint summary is stored once, giving (512 + 64) × 2 = 1,152 bytes." },
    { q: "Text grows beyond the local window in a model with local and global layers. Which cache keeps growing?", choices: ["None", "Only local layers", "Global layers", "Expert weights"], answer: 2, why: "Global layers keep the whole past even when local layers drop old entries." },
  ],
  sources: [
    { label: "DeepSeek-V3 technical report, MLA, MoE load balancing, and multi-token prediction", url: "https://arxiv.org/abs/2412.19437" },
    { label: "DeepSeek-V3 published configuration: 61 layers, kv_lora_rank 512, RoPE dimension 64", url: "https://huggingface.co/deepseek-ai/DeepSeek-V3/blob/main/config.json" },
    { label: "Qwen2.5-32B published configuration: 40 query heads, 8 KV heads, 64 layers", url: "https://huggingface.co/Qwen/Qwen2.5-32B/blob/main/config.json" },
    { label: "Qwen3-Coder-Next model card (accessed October 2026)", url: "https://huggingface.co/Qwen/Qwen3-Coder-Next" },
    { label: "OpenAI, Introducing gpt-oss (2025), MoE and full/local GQA", url: "https://openai.com/index/introducing-gpt-oss/" },
    { label: "MiniMax M2 report (July 2026), full attention/GQA and speculative MTP", url: "https://arxiv.org/html/2605.26494" },
    { label: "dQwen3.5 (September 2026), diffusion adaptation of hybrid autoregressive models", url: "https://arxiv.org/html/2609.20751" },
  ],
} satisfies Lesson;

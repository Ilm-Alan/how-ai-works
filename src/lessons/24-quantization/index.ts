import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "quantization",
  title: "Quantization",
  part: "training",
  body,
  lab: { title: "Round a weight matrix to fewer bits", mount },
  quiz: [
    {
      q: "A model spends most of its generation time reading weights. Why can four-bit weights help?",
      choices: [
        "Four-bit math is always exact",
        "There are fewer bytes to read",
        "The model has fewer layers",
      ],
      answer: 1,
      why: "Reading fewer bytes can speed up a model whose main limit is memory bandwidth.",
    },
    {
      q: "One weight is 50 times larger than the rest. All share one INT4 scale. What happens?",
      choices: ["Small weights stay exact", "Most small weights round to zero", "All small weights become the largest value"],
      answer: 1,
      why: "The large weight sets a wide rounding step for the whole group.",
    },
    {
      q: "An MXFP4 block has 32 four-bit weights and an eight-bit scale. How many bits per weight is that?",
      choices: ["4.25", "8", "4", "32"],
      answer: 0,
      why: "The scale adds 8 ÷ 32 = 0.25 bits to each four-bit weight.",
    },
    {
      q: "You want to protect weights whose inputs matter most. Which method does that?",
      choices: ["Plain rounding", "AWQ", "Weight decay"],
      answer: 1,
      why: "AWQ uses sample inputs to give important weight channels more detail before rounding.",
    },
  ],
  sources: [
    { label: "OCP Microscaling Formats (MX) Specification v1.0", url: "https://www.opencompute.org/documents/ocp-microscaling-formats-mx-v1-0-spec-final-pdf" },
    { label: "NVIDIA 2025, Pretraining Large Language Models with NVFP4", url: "https://arxiv.org/abs/2509.25149" },
    { label: "OpenAI, Introducing gpt-oss (MXFP4 weights), Aug 2025", url: "https://openai.com/index/introducing-gpt-oss/" },
    { label: "DeepSeek-AI 2024, DeepSeek-V3 Technical Report (FP8 training)", url: "https://arxiv.org/abs/2412.19437" },
    { label: "Frantar et al. 2022, GPTQ", url: "https://arxiv.org/abs/2210.17323" },
    { label: "Lin et al. 2023, AWQ: Activation-aware Weight Quantization", url: "https://arxiv.org/abs/2306.00978" },
    { label: "Dettmers et al. 2022, LLM.int8(): 8-bit Matrix Multiplication for Transformers at Scale", url: "https://arxiv.org/abs/2208.07339" },
    { label: "vLLM documentation (supported quantization formats)", url: "https://docs.vllm.ai/en/latest/" },
  ],
} satisfies Lesson;

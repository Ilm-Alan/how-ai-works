import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "efficient-adaptation",
  title: "Adapting a model",
  part: "training",
  body,
  lab: { title: "Low-rank approximation and LoRA", mount },
  quiz: [
    {
      q: "A bot needs a fixed JSON format, but its facts change weekly. What fits each need?",
      choices: [
        "Fine-tune for format and voice; retrieve the changing facts",
        "Fine-tune weekly on the new facts",
        "Distill a new model each week",
      ],
      answer: 0,
      why: "Fine-tuning suits stable behavior; retrieval suits knowledge that changes.",
    },
    {
      q: "A 4096×4096 weight matrix gets two thin LoRA matrices of sizes 4096×8 and 8×4096. How many weights do you train?",
      choices: ["32,768", "65,536", "16.8 million", "8"],
      answer: 1,
      why: "The two thin matrices hold 4096 × 8 + 8 × 4096 = 65,536 weights.",
    },
    {
      q: "Why does rank 8 lose much of the pure-noise matrix?",
      choices: [
        "The math fails on noise",
        "Many directions matter, not just eight",
        "Noise has no directions",
      ],
      answer: 1,
      why: "A low rank works best when a few directions hold most of the useful change.",
    },
    {
      q: "A student matches its teacher's next-token chances instead of copying text. What extra information does it get?",
      choices: [
        "How likely each possible next token is",
        "The teacher's weights",
        "The teacher's training data",
      ],
      answer: 0,
      why: "The full set of chances teaches more than the one token the teacher chose.",
    },
  ],
  sources: [
    { label: "Hu et al. 2021, LoRA: Low-Rank Adaptation of Large Language Models", url: "https://arxiv.org/abs/2106.09685" },
    { label: "Dettmers et al. 2023, QLoRA: Efficient Finetuning of Quantized LLMs", url: "https://arxiv.org/abs/2305.14314" },
    { label: "Biderman et al. 2024, LoRA Learns Less and Forgets Less", url: "https://arxiv.org/abs/2405.09673" },
    { label: "Ilharco et al. 2022, Editing Models with Task Arithmetic", url: "https://arxiv.org/abs/2212.04089" },
    { label: "Yadav et al. 2023, TIES-Merging", url: "https://arxiv.org/abs/2306.01708" },
    { label: "Hinton et al. 2015, Distilling the Knowledge in a Neural Network", url: "https://arxiv.org/abs/1503.02531" },
    { label: "Gemma Team 2024, Gemma 2 (knowledge distillation for smaller models)", url: "https://arxiv.org/abs/2408.00118" },
    { label: "DeepSeek-AI 2025, DeepSeek-R1 (distilled Qwen and Llama models)", url: "https://arxiv.org/abs/2501.12948" },
    { label: "DeepSeek-V4-Pro model card (on-policy distillation of domain experts)", url: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro" },
    { label: "Qwen Team 2026, Qwen3-Coder-Next technical report (distilling domain experts)", url: "https://arxiv.org/abs/2603.00729" },
  ],
} satisfies Lesson;

import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "scaling-laws",
  title: "Scaling laws",
  part: "language-models",
  body,
  lab: { title: "Spend the same FLOPs two ways", mount },
  quiz: [
    { q: "At the same training cost, you halve a dense model's weights. How many tokens can it train on?", choices: ["Half as many", "The same", "Twice as many", "Four times as many"], answer: 2, why: "Cost is roughly six times weights times tokens, so half the weights allows twice the tokens." },
    { q: "You have 5 trillion good tokens, but need 20 trillion training tokens. What does the data-reuse study suggest?", choices: ["About four passes can work nearly as well as fresh text", "Any reuse hurts", "Forty passes cost no quality"], answer: 0, why: "The study found small penalties up to about four passes, then shrinking gains." },
    { q: "A model half the best training size has almost the same loss. Why choose it?", choices: ["It needs fewer training operations", "Each output token costs less", "It cannot memorize"], answer: 1, why: "A smaller dense model uses fewer weights each time it generates a token." },
    { q: "A test gives credit only for ten correct digits, and its score jumps. What might explain this?", choices: ["Every digit's chance jumped", "Small gains became a big all-or-nothing gain", "Loss stopped mattering"], answer: 1, why: "Small improvements on each digit can produce a large change in whole-answer scores." },
  ],
  sources: [
    { label: "Hoffmann et al. 2022, Training Compute-Optimal Large Language Models", url: "https://arxiv.org/abs/2203.15556" },
    { label: "Besiroglu et al. 2024, Chinchilla Scaling: A replication attempt (refit constants)", url: "https://arxiv.org/abs/2404.10102" },
    { label: "Meta, Llama 3 model card (15T+ training tokens)", url: "https://github.com/meta-llama/llama3/blob/main/MODEL_CARD.md" },
    { label: "Z.ai, GLM-5 (28.5T tokens)", url: "https://z.ai/blog/glm-5" },
    { label: "DeepSeek-V4.1-Flash model card (45T tokens)", url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash" },
    { label: "Muennighoff et al. 2023, Scaling Data-Constrained Language Models", url: "https://arxiv.org/abs/2305.16264" },
    { label: "Schaeffer et al. 2023, Are Emergent Abilities of Large Language Models a Mirage?", url: "https://arxiv.org/abs/2304.15004" },
  ],
} satisfies Lesson;

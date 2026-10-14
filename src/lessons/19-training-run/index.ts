import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "training-run", title: "Anatomy of a training run", part: "training", body,
  lab: { title: "Schedule the same training run", mount },
  quiz: [
    { q: "You want to finish copies of one run at different times. What should you do?", choices: ["Start from random weights each time", "Copy the loss plot", "Save the steady-rate state and branch short decays", "Only increase the batch"], answer: 2, why: "A steady-rate checkpoint can seed several runs with different ending decays." },
    { q: "More devices split the same matrix work, but the text batch stays fixed. What happens to tokens per update?", choices: ["No change", "Twice as many", "Half as many"], answer: 0, why: "Splitting work on the same text does not add training tokens." },
    { q: "A four-bit training recipe keeps some weights in 32 bits. Is that a mistake?", choices: ["Yes, all numbers must use four bits", "Yes, training cannot work", "No, precise state can coexist with low-bit math"], answer: 2, why: "Mixed precision uses fewer bits for costly math while keeping sensitive state more precise." },
    { q: "You reload AdamW weights but discard its gradient history. Will training continue exactly as before?", choices: ["Yes, if the rate matches", "Not necessarily", "The data position is restored too"], answer: 1, why: "Future updates depend on optimizer, schedule, data, and random state as well as weights." },
  ],
  sources: [
    { label: "Kimi K2 technical report, arXiv:2507.20534 (updated February 2026): MuonClip and distributed infrastructure", url: "https://arxiv.org/html/2507.20534" },
    { label: "NVIDIA, Pretraining Large Language Models with NVFP4 (September 2025): WSD, FP8/FP4 results and precision recipe", url: "https://arxiv.org/html/2509.25149v1" },
    { label: "Loshchilov and Hutter, Decoupled Weight Decay Regularization: AdamW", url: "https://arxiv.org/abs/1711.05101" },
    { label: "Hu et al., MiniCPM: warmup-stable-decay schedules", url: "https://arxiv.org/abs/2404.06395" },
    { label: "Chowdhery et al., PaLM: model FLOPs utilization definition", url: "https://arxiv.org/abs/2204.02311" },
    { label: "Rajbhandari et al., ZeRO: memory optimizations for training trillion parameter models", url: "https://arxiv.org/abs/1910.02054" },
    { label: "Mistral Large 4 announcement (October 2026): training cluster", url: "https://mistral.ai/news/mistral-large-4/" },
  ],
} satisfies Lesson;

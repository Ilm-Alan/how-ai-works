import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "evaluating-llms", title: "Evaluating LLMs", part: "frontier", body,
  lab: { title: "Votes, ratings, and uncertain ranks", mount },
  quiz: [
    { q: "Two close models swap rank when you generate 60 new votes. What is the likely cause?", choices: ["A broken rating tool", "Too few votes to separate them clearly", "Changed model weights"], answer: 1, why: "Noise from a small vote sample can reverse a close rank." },
    { q: "A model tops a human preference ranking. What does that tell you?", choices: ["Voters tend to prefer its answers", "It is right most often", "It wins every task"], answer: 0, why: "A preference rating measures which answers people like, not how often they are correct." },
    { q: "A coding model gains 10 points after you upgrade its tools. What can you conclude?", choices: ["Its weights improved", "All coding got 10% easier", "The model-plus-tools did better on this test"], answer: 2, why: "A tool change improves the tested system without showing that the model itself changed." },
    { q: "An AI judge prefers a longer answer with no new content. What should you check?", choices: ["Give it more tokens", "Whether it rewards length instead of quality", "Remove short answers"], answer: 1, why: "Extra words should not earn points unless they improve the answer." },
  ],
  sources: [
    { label: "OpenAI, Why we no longer evaluate SWE-bench Verified (2026)", url: "https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/" },
    { label: "ARC Prize, GPT-6.1 Sol results (September 2026)", url: "https://arcprize.org/results/openai-gpt-6-1-sol" },
    { label: "Arena policy (updated September 2026)", url: "https://arena.ai/blog/policy" },
    { label: "Arena, sentiment control (2025)", url: "https://arena.ai/blog/sentiment-control/" },
    { label: "Zheng et al., Judging LLM-as-a-Judge (2023)", url: "https://arxiv.org/html/2306.05685v4" },
    { label: "DeepSeek V4-Pro model card (accessed October 2026)", url: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro" },
    { label: "Hunter, MM algorithms for generalized Bradley–Terry models (2004)", url: "https://doi.org/10.1214/aos/1079120141" },
  ],
} satisfies Lesson;

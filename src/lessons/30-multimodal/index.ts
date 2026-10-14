import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "multimodal",
  title: "Images, audio, and video in",
  part: "building",
  body,
  lab: { title: "Patch budget and contrastive matching", mount },
  quiz: [
    { q: "Keep image size fixed and halve patch side. How many full-attention scores do you get?", choices: ["Twice as many", "Four times as many", "16 times as many", "The same number"], answer: 2, why: "Four times as many patches means 16 times as many pairwise scores." },
    { q: "Swap two captions but keep their old labels. What can lower temperature do?", choices: ["Make wrong matches more costly", "Fix the labels", "Make all scores equal"], answer: 0, why: "Lower temperature sharpens scores but cannot fix wrong labels." },
    { q: "The grid has 1024 patches. Must a provider bill 1024 tokens?", choices: ["Yes", "No, billing has its own rules", "No, images are free"], answer: 1, why: "Provider resizing and tile rules can differ from the patch grid." },
    { q: "A brief event occurs between sampled video frames. What can you conclude?", choices: ["Timestamps reveal it exactly", "Higher resolution recovers it", "A transcript always captures it", "The input may miss it"], answer: 3, why: "Sharper frames cannot recover a moment that was never sampled." },
  ],
  sources: [
    { label: "Dosovitskiy et al., An Image is Worth 16x16 Words (2020)", url: "https://arxiv.org/abs/2010.11929" },
    { label: "Radford et al., CLIP: symmetric contrastive loss (2021)", url: "https://proceedings.mlr.press/v139/radford21a/radford21a.pdf" },
    { label: "Liu et al., Visual Instruction Tuning (2023): vision encoder and projection", url: "https://arxiv.org/abs/2304.08485" },
    { label: "OpenAI, Images and vision: token accounting (accessed Oct 14, 2026)", url: "https://developers.openai.com/api/docs/guides/images-vision" },
    { label: "OpenAI, Hello GPT-4o (May 2024): transcript pipeline versus end-to-end audio", url: "https://openai.com/index/hello-gpt-4o/" },
    { label: "Google, Introducing Gemini 4 Argon (Sept 2026)", url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/" },
    { label: "Google, Gemini 4 Argon: inputs and output (Oct 2026)", url: "https://ai.google.dev/gemini-api/docs/models/gemini-4-argon" },
    { label: "Qwen3.8-27B model card (accessed Oct 14, 2026)", url: "https://huggingface.co/Qwen/Qwen3.8-27B" },
    { label: "Kimi K3 model card (accessed Oct 14, 2026)", url: "https://huggingface.co/moonshotai/Kimi-K3" },
    { label: "Meta, Llama 4 native multimodality (Apr 5, 2025)", url: "https://ai.meta.com/blog/Llama-4-multimodal-intelligence/" },
  ],
} satisfies Lesson;

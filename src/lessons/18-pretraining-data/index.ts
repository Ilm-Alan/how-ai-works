import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "pretraining-data", title: "Pretraining data", part: "training", body,
  lab: { title: "Find near-duplicate documents", mount },
  quiz: [
    { q: "Two pages differ in one word. What usually happens when you use longer word groups?", choices: ["All groups match", "The edit breaks more overlapping groups", "Only fingerprint length changes", "You compare meaning, not wording"], answer: 1, why: "One changed word affects more groups when each group spans more words." },
    { q: "Keep rows per band fixed and add more bands. What happens?", choices: ["Fewer pairs need checks", "You get a hard cutoff", "Only exact copies match", "More pairs can match a band"], answer: 3, why: "Each extra band gives another chance to match, so pairs still need checking." },
    { q: "A model trained on 30 trillion tokens. Must all of them be unique human text?", choices: ["No: they can include repeats, generated text, and other media", "Yes: tokens count unique pages", "Yes: tokens count weights", "Yes: removing copies guarantees this"], answer: 0, why: "Training volume counts what the model sees, including repeated or generated material." },
    { q: "A quality filter removes most casual chats. What should you conclude?", choices: ["The chats were false", "The kept text has no bias", "The mix changed and needs checking", "Longer fingerprints will restore chats"], answer: 2, why: "A filter changes which kinds of language the model learns, not just how clean the text is." },
  ],
  sources: [
    { label: "Penedo et al., The FineWeb Datasets (2024): extraction, filtering, deduplication and FineWeb-Edu", url: "https://arxiv.org/html/2406.17557" },
    { label: "Leskovec, Rajaraman and Ullman, Mining of Massive Datasets, chapter 3: MinHash and LSH", url: "https://infolab.stanford.edu/~ullman/mmds/ch3n.pdf" },
    { label: "Kimi K2 technical report (updated February 2026): data rephrasing and fidelity checks", url: "https://arxiv.org/html/2507.20534" },
    { label: "GLM-5 report (2026): 28.5T training tokens", url: "https://z.ai/blog/glm-5" },
    { label: "DeepSeek V4.1 Flash model card (2026): multimodal training volume", url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash" },
    { label: "European Commission GPAI obligations guidance: copyright policy and training-content summary", url: "https://digital-strategy.ec.europa.eu/en/faqs/guidelines-obligations-general-purpose-ai-providers" },
  ],
} satisfies Lesson;

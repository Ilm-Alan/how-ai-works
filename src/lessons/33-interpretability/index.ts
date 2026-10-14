import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "interpretability", title: "Looking inside", part: "frontier", body,
  lab: { title: "Five features in two dimensions", mount },
  quiz: [
    { q: "Five features rarely appear at the same time. Why can they share a small hidden space?", choices: ["They add hidden dimensions", "Their arrows never overlap", "Their arrows collide less often"], answer: 2, why: "When few features are active, sharing space causes less interference." },
    { q: "Five long feature arrows fit in two dimensions. What must be true?", choices: ["Some arrows share directions", "There are really five dimensions", "No information can be lost"], answer: 0, why: "Only two mutually perpendicular directions fit in two dimensions." },
    { q: "A probe reads sentiment from hidden values. What does that prove?", choices: ["The model uses sentiment to answer", "The probe can find sentiment information", "Changing sentiment has no side effects"], answer: 1, why: "Finding information does not prove the original model relies on it." },
    { q: "A graph labels a feature ‘planning.’ What should you do next?", choices: ["Trust the label", "Assume all prompts use it", "Change the feature and test new prompts"], answer: 2, why: "The label is a guess that controlled changes can test." },
  ],
  sources: [
    { label: "Elhage et al., Toy Models of Superposition (2022)", url: "https://transformer-circuits.pub/2022/toy_model" },
    { label: "Anthropic, Mapping the mind of a large language model (2024)", url: "https://www.anthropic.com/research/mapping-mind-language-model" },
    { label: "Anthropic, Open-sourcing circuit tracing tools (2025)", url: "https://www.anthropic.com/research/open-source-circuit-tracing" },
    { label: "Circuit-tracer implementation", url: "https://github.com/safety-research/circuit-tracer" },
    { label: "Elazar et al., Amnesic Probing (2021)", url: "https://arxiv.org/html/2006.00995v3" },
  ],
} satisfies Lesson;

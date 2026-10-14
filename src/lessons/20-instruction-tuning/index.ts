import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "instruction-tuning", title: "From base model to assistant", part: "training", body,
  lab: { title: "Conversation tokens and loss masks", mount },
  quiz: [
    { q: "You mask a user's words during training. Does the model still read them?", choices: ["No, they are deleted", "Yes, they give context but are not targets", "Only their first token"], answer: 1, why: "The mask chooses which predictions count, not which input words the model reads." },
    { q: "You train on answer words and their stop marker. What does the marker teach?", choices: ["When to end the answer", "How to fit more input", "How to avoid every wrong answer"], answer: 0, why: "Ending a response is part of the behavior the model must learn." },
    { q: "Training improves document formatting but harms coding. What should you do?", choices: ["Only add more formatting examples", "Trust the training score", "Test both old and new skills"], answer: 2, why: "Learning one narrow task can weaken skills that the new training score does not measure." },
    { q: "You load a different model but keep the old chat markers. What can go wrong?", choices: ["The model translates every marker", "Input length becomes unlimited", "The markers do not match its training"], answer: 2, why: "The model learned its own role and ending markers during training." },
  ],
  sources: [
    { label: "Ouyang et al., Training language models to follow instructions with human feedback", url: "https://arxiv.org/abs/2203.02155" },
    { label: "Meta, official Llama 3 prompt format", url: "https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/meta-llama-3/" },
    { label: "OpenAI, official Harmony format specification (accessed October 2026)", url: "https://github.com/openai/harmony/blob/main/docs/format.md" },
  ],
} satisfies Lesson;

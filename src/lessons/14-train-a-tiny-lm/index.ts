import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "train-a-tiny-lm",
  title: "Train a tiny language model",
  part: "language-models",
  body,
  lab: { title: "A transformer from random weights", mount },
  quiz: [
    { q: "You double the number of characters a model can choose from. What happens to equal-chance loss?", choices: ["It stays fixed", "It doubles", "It rises by ln(2)", "It falls"], answer: 2, why: "Equal-chance loss is ln(V), so doubling V adds ln(2)." },
    { q: "Training loss falls, but unseen text loss rises. How should you choose a model?", choices: ["Compare loss on unseen text", "Raise sample temperature", "Train on the unseen text too", "Pick the nicest sample"], answer: 0, why: "Unseen text tests whether the model learned patterns beyond its training examples." },
    { q: "You change Sample temperature from 0.8 to 0 without training. What happens?", choices: ["Learning speeds up", "Unseen text loss falls", "Attention sees future text", "Each step picks the top character"], answer: 3, why: "Temperature 0 always picks the highest-scoring character without changing weights." },
    { q: "For inputs `tho` and targets `hou`, why hide later input characters?", choices: ["To remove positions", "They contain the answers", "To share output weights", "To shrink the vocabulary"], answer: 1, why: "The next input character is the current target, so seeing it would let the model cheat." },
  ],
  sources: [
    { label: "Vaswani et al. (2017), Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" },
    { label: "Radford et al. (2019), Language Models are Unsupervised Multitask Learners", url: "https://cdn.openai.com/better-language-models/language_models_are_unsupervised_multitask_learners.pdf" },
    { label: "Shakespeare, Sonnets (public domain, Project Gutenberg)", url: "https://www.gutenberg.org/ebooks/1041" },
    { label: "Carroll, Alice's Adventures in Wonderland (public-domain source; chapters 1–2)", url: "https://www.gutenberg.org/ebooks/11" },
  ],
} satisfies Lesson;

import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "backpropagation",
  title: "Backpropagation",
  part: "basics",
  body,
  lab: { title: "Trace a neuron forward and backward", mount },
  quiz: [
    { q: "Two paths use the same hidden value and affect the loss. How do you find its loss slope?", choices: ["Keep the larger contribution", "Multiply both contributions", "Add both contributions"], answer: 2, why: "The total effect includes the contributions from both paths." },
    { q: "Tanh is nearly flat, but the prediction is wrong. What can happen to the weight slopes?", choices: ["They can be tiny", "They must grow", "They equal the loss"], answer: 0, why: "The error is multiplied by tanh's tiny local slope." },
    { q: "A model has a million weights and one loss. Why work backward?", choices: ["The model size does not affect runtime", "One pass finds slopes for all weights", "No forward pass is needed"], answer: 1, why: "The backward pass shares work across weights instead of rerunning the model for each one." },
    { q: "You save only some forward values to use less memory. What is the cost?", choices: ["A different loss", "Fewer weights", "Recomputing the missing values"], answer: 2, why: "Checkpointing recomputes unsaved values during the backward pass." },
  ],
  sources: [
    { label: "Goodfellow, Bengio, Courville, Deep Learning: Back-Propagation and Other Differentiation Algorithms", url: "https://www.deeplearningbook.org/contents/mlp.html" },
    { label: "Baydin et al., Automatic Differentiation in Machine Learning: a Survey", url: "https://arxiv.org/abs/1502.05767" },
    { label: "Chen et al., Training Deep Nets with Sublinear Memory Cost", url: "https://arxiv.org/abs/1604.06174" },
  ],
} satisfies Lesson;

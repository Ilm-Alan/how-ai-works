import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "gradient-descent",
  title: "Loss and gradient descent",
  part: "basics",
  body,
  lab: { title: "Optimizers on a loss surface", mount },
  quiz: [
    {
      q: "In the lab's narrow valley, plain descent needs a rate below 0.1. You set it to 0.2. What happens?",
      choices: ["Slow progress", "Fast progress", "The path runs away", "It stops at the minimum"],
      answer: 2,
      why: "The step is too large for the steep direction, so it overshoots and grows.",
    },
    {
      q: "Steps point along a valley but swing back and forth across it. How does momentum help?",
      choices: ["It checks second derivatives", "Forward steps add up; swings cancel", "It always raises the rate"],
      answer: 1,
      why: "Momentum remembers past gradients, favoring directions that keep pointing the same way.",
    },
    {
      q: "Adam reaches a low point but keeps bouncing around it. What should you try?",
      choices: ["Raise the rate", "Always switch methods", "Lower the rate near the end", "Use less data"],
      answer: 2,
      why: "Smaller steps help the model settle near the low point.",
    },
    {
      q: "Your batch gives a noisy gradient. What does a larger batch usually do?",
      choices: ["Reduces noise but costs more per step", "Raises the rate by itself", "Leaves the estimate unchanged"],
      answer: 0,
      why: "Averaging more examples reduces noise but requires more work.",
    },
  ],
  sources: [
    { label: "Kingma & Ba 2014, Adam: A Method for Stochastic Optimization", url: "https://arxiv.org/abs/1412.6980" },
    { label: "Loshchilov & Hutter 2017, Decoupled Weight Decay Regularization (AdamW)", url: "https://arxiv.org/abs/1711.05101" },
    { label: "Kimi Team 2025, Kimi K2: Open Agentic Intelligence (MuonClip optimizer)", url: "https://arxiv.org/abs/2507.20534" },
  ],
} satisfies Lesson;

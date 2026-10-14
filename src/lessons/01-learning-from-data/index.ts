import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "learning-from-data",
  title: "Learning from data",
  part: "basics",
  body,
  lab: { title: "Fit a curve, test on new points", mount },
  quiz: [
    {
      q: "You fit degree 4 and degree 10 curves to the same 15 points. Which best fit has lower training error?",
      choices: ["Degree 4 must win", "Degree 10 is no worse", "The test set decides"],
      answer: 1,
      why: "A degree 10 curve can do everything a degree 4 curve can do on the training points.",
    },
    {
      q: "A team picks its model by trying settings on the test set. What is wrong?",
      choices: ["Nothing", "The test score helped choose the model", "It should use training scores only"],
      answer: 1,
      why: "Choose settings on validation data so the test score stays an independent check.",
    },
    {
      q: "A curve fits 12 noisy points but misses new points. Which change does not address the problem?",
      choices: ["Add more data", "Charge for large weights", "Use a simpler curve", "Fit the same points even more closely"],
      answer: 3,
      why: "Fitting noise more closely does not help the curve predict new points.",
    },
    {
      q: "A model hides each next word and learns to predict it. Who supplies the right answers?",
      choices: ["The text itself", "A person labels every word", "A reward score supplies each word"],
      answer: 0,
      why: "The next word in the text is the target, so no person needs to label it.",
    },
  ],
  sources: [
    { label: "Belkin et al. 2019, Reconciling modern machine learning practice and the bias-variance trade-off", url: "https://arxiv.org/abs/1812.11118" },
    { label: "Grinsztajn et al. 2022, Why do tree-based models still outperform deep learning on tabular data?", url: "https://arxiv.org/abs/2207.08815" },
    { label: "Hollmann et al. 2025, Accurate predictions on small data with a tabular foundation model (Nature)", url: "https://www.nature.com/articles/s41586-024-08328-6" },
  ],
} satisfies Lesson;

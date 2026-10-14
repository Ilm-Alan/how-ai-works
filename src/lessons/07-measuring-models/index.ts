import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "measuring-models",
  title: "Measuring a model",
  part: "basics",
  body,
  lab: { title: "Thresholds, base rates, and noise", mount },
  quiz: [
    {
      q: "A disease affects 1 in 1,000 people. A test catches 99% of cases but flags 1% of healthy people. About how many flagged people are sick?",
      choices: ["99%", "50%", "9%", "1%"],
      answer: 2,
      why: "Among 100,000 people, about 99 sick and 999 healthy people get flagged, so only about 9% are sick.",
    },
    {
      q: "Two models score 81% and 82.5% on 400 questions. What should you do?",
      choices: [
        "Declare the second model better",
        "Gather more evidence: the gap may be noise",
        "Declare the first model better",
      ],
      answer: 1,
      why: "Each score has a rough range of four points on either side, larger than the gap.",
    },
    {
      q: "You add more healthy people to a test, with the same score patterns. Which measure stays the same?",
      choices: ["Precision", "Accuracy", "Recall"],
      answer: 2,
      why: "Recall looks only at the real cases, not the healthy people.",
    },
    {
      q: "A stock model scores 70% on randomly mixed days but 51% on the next year. What flaw should you check first?",
      choices: ["Too few model weights", "Training on future days to predict past days", "Too many test questions"],
      answer: 1,
      why: "Randomly mixing dates can let future data leak into training, so split by time.",
    },
  ],
  sources: [
    { label: "Fawcett 2006, An introduction to ROC analysis", url: "https://doi.org/10.1016/j.patrec.2005.10.010" },
    { label: "Kaufman et al. 2012, Leakage in data mining: formulation, detection, and avoidance", url: "https://doi.org/10.1145/2382577.2382579" },
    { label: "Miller 2024, Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations", url: "https://arxiv.org/abs/2411.00640" },
  ],
} satisfies Lesson;

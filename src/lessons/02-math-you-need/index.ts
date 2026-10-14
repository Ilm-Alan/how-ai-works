import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "math-you-need",
  title: "The math you need",
  part: "basics",
  body,
  lab: { title: "Matrices and softmax", mount },
  quiz: [
    {
      q: "A matrix has 2 rows and 3 columns; another has 3 rows and 4 columns. What shape is their product?",
      choices: ["3 by 3", "2 by 4", "2 by 3", "The sizes do not match"],
      answer: 1,
      why: "The inner sizes match, and the outer sizes give 2 rows and 4 columns.",
    },
    {
      q: "You add 10 to every answer's score before softmax. What happens to the chances?",
      choices: ["The top answer gains", "They stay the same", "They become more even"],
      answer: 1,
      why: "Softmax uses score differences, which stay the same when every score rises by 10.",
    },
    {
      q: "A model gives the right word a chance of 0.01. What is its loss, using the natural log?",
      choices: ["0.01", "0.99", "About 4.6", "100"],
      answer: 2,
      why: "The loss is −ln(0.01), about 4.6, so a low chance for the right word costs more.",
    },
    {
      q: "You stack three matrix maps with no functions between them. What can the result do?",
      choices: ["Bend straight lines", "Only what one matrix map can do", "Always give chances"],
      answer: 1,
      why: "Several matrix maps in a row still combine into one matrix map.",
    },
  ],
  sources: [
    { label: "Llama Team 2024, The Llama 3 Herd of Models (Table 3: 8B model dimension 4096)", url: "https://arxiv.org/abs/2407.21783" },
    { label: "DeepSeek-V3 config (hidden size 7168)", url: "https://huggingface.co/deepseek-ai/DeepSeek-V3/blob/main/config.json" },
  ],
} satisfies Lesson;

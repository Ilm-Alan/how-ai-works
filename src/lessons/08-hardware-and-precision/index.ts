import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
import { sources } from "./specs";

export default {
  slug: "hardware-and-precision",
  title: "Hardware and number formats",
  part: "basics",
  body,
  lab: { title: "Compute roof, memory slope", mount },
  quiz: [
    {
      q: "A task waits on memory. You double chip peak but leave memory speed and reads unchanged. What happens to its speed limit?",
      choices: ["It doubles", "It stays the same", "It halves", "Memory stops mattering"],
      answer: 1,
      why: "More chip speed cannot help when the same memory supply is still the limit.",
    },
    {
      q: "In the lab, you double the side of a square matrix. What happens to work per byte?",
      choices: ["It stays the same", "It rises eightfold", "It rises fourfold", "It doubles"],
      answer: 3,
      why: "Work grows eightfold while data grows fourfold, so their ratio doubles.",
    },
    {
      q: "You need to store very large numbers in two bytes. Why choose BF16 rather than FP16?",
      choices: ["It has more range but less fine detail", "It keeps more fine detail", "Both have the same range", "It never rounds"],
      answer: 0,
      why: "BF16 spends more bits on range and fewer on fine detail.",
    },
    {
      q: "A model's FP4 weights fit on one chip. Does that prove training fits too?",
      choices: ["Yes, all training data uses FP4", "Yes, training needs only twice as much", "No, training needs more stored data", "Yes, if batch is one"],
      answer: 2,
      why: "Training also stores gradients and update state, plus other working memory.",
    },
  ],
  sources,
} satisfies Lesson;

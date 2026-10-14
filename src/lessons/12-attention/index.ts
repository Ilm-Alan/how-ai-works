import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "attention",
  title: "Attention",
  part: "language-models",
  body,
  lab: { title: "Scores, weights, and value mixtures", mount },
  quiz: [
    {
      q: "Future tokens are blocked. You change only their values. What happens to the first position's output?",
      choices: ["It changes", "It stays the same", "It shrinks"],
      answer: 1,
      why: "The first position can read only its own value, with a share of one.",
    },
    {
      q: "A head mixes shares [0.25, 0.75] with values [2, 0] and [0, 4]. What comes out?",
      choices: ["[2, 4]", "[1, 2]", "[0.5, 3]", "[0.75, 0.25]"],
      answer: 2,
      why: "Take a quarter of the first value and three quarters of the second, then add them.",
    },
    {
      q: "You lower score temperature and keep all vectors and blocking rules fixed. What changes?",
      choices: ["The strongest allowed match gets more weight, unless tied", "All values get larger", "Future tokens become visible", "The top score changes sign"],
      answer: 0,
      why: "Lower temperature widens score gaps, which concentrates the shares on stronger matches.",
    },
    {
      q: "A heatmap shows a share of 0.95 for one token. What can you conclude?",
      choices: ["It caused 95% of the answer", "Removing it must change the answer", "Its value points toward the output", "This head mixes in 95% of its value"],
      answer: 3,
      why: "A share measures this mix, not the token's effect on the final answer.",
    },
  ],
  sources: [
    { label: "Vaswani et al., Attention Is All You Need (scaled dot-product and multi-head attention)", url: "https://arxiv.org/abs/1706.03762" },
    { label: "Jain and Wallace, Attention is not Explanation", url: "https://aclanthology.org/N19-1357/" },
    { label: "Dao et al., FlashAttention (exact attention without materializing the full matrix)", url: "https://arxiv.org/abs/2205.14135" },
  ],
} satisfies Lesson;

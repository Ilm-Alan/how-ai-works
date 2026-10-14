import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  "slug": "next-token-prediction",
  "title": "Predicting the next token",
  "part": "language-models"
,
  body,
  lab: { title: "Character continuation", mount },
  quiz: [
  {
    "q": "Top-p is 0.8. The next choices have chances 0.6, 0.25, and 0.15. Which stay?",
    "choices": [
      "Only 0.6",
      "0.6 and 0.25",
      "All three"
    ],
    "answer": 1,
    "why": "The first two reach 0.85, so both stay to cross the 0.8 target."
  },
  {
    "q": "The best choice has chance 0.4 and min-p is 0.1. What is the cutoff?",
    "choices": [
      "0.04",
      "0.1",
      "0.4"
    ],
    "answer": 0,
    "why": "The cutoff is one tenth of the best chance: 0.1 × 0.4 = 0.04."
  },
  {
    "q": "An order-6 model learns from a short text. Why does it often use fewer than five previous characters?",
    "choices": [
      "Its chances cannot add to one",
      "Five characters capture every meaning",
      "Many five-character patterns never appeared"
    ],
    "answer": 2,
    "why": "Short text contains only a small share of all possible five-character patterns."
  },
  {
    "q": "You change temperature but do not retrain. What happens to test loss?",
    "choices": [
      "It must decrease",
      "It stays unchanged",
      "It becomes zero with greedy decoding"
    ],
    "answer": 1,
    "why": "Temperature changes the picks during generation, while loss uses the unchanged model chances."
  }
],
  sources: [
  {
    "label": "Jurafsky and Martin, Speech and Language Processing, n-gram language models",
    "url": "https://web.stanford.edu/~jurafsky/slp3/3.pdf"
  },
  {
    "label": "Holtzman et al., The Curious Case of Neural Text Degeneration",
    "url": "https://arxiv.org/abs/1904.09751"
  },
  {
    "label": "Nguyen et al., Turning Up the Heat: Min-p Sampling for Creative and Coherent LLM Outputs",
    "url": "https://arxiv.org/abs/2407.01082"
  },
  {
    "label": "Lewis Carroll, Alice’s Adventures in Wonderland (public-domain corpus)",
    "url": "https://www.gutenberg.org/ebooks/11"
  }
]
} satisfies Lesson;

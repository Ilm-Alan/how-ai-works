import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  "slug": "embeddings",
  "title": "Embeddings",
  "part": "language-models"
,
  body,
  lab: { title: "Learn vectors from a book", mount },
  quiz: [
  {
    "q": "Cat and dog never appear together, but share many nearby words. What can learned vectors do?",
    "choices": [
      "Place them near each other",
      "Force their similarity to zero",
      "Assign the same token ID"
    ],
    "answer": 0,
    "why": "Matching nearby-word patterns can make vectors close even without a direct pair count."
  },
  {
    "q": "Hot and cold often fit in the same sentence. Why might their vectors be close?",
    "choices": [
      "The model ignores all words",
      "Opposites cannot have vectors",
      "They share many nearby words"
    ],
    "answer": 2,
    "why": "Similar use does not mean the words have the same meaning."
  },
  {
    "q": "Two words look far apart in the plot but rank as close at 20 dimensions. Why?",
    "choices": [
      "The ranking must be wrong",
      "The plot hides 18 dimensions",
      "Only two dimensions can measure closeness"
    ],
    "answer": 1,
    "why": "The plot shows two numbers per word, while the ranking uses all 20."
  },
  {
    "q": "You subtract one word vector and add another. A word ranks first. What does that prove?",
    "choices": [
      "The model learned the intended link",
      "The word is certainly right",
      "It is the closest available choice"
    ],
    "answer": 2,
    "why": "The nearest choice can still be a poor match for the link you wanted."
  }
],
  sources: [
  {
    "label": "Levy and Goldberg, Neural Word Embedding as Implicit Matrix Factorization",
    "url": "https://papers.nips.cc/paper/2014/hash/feab05aa91085b7a8012516bc3533958-Abstract.html"
  },
  {
    "label": "Deerwester et al., Indexing by Latent Semantic Analysis",
    "url": "https://doi.org/10.1002/(SICI)1097-4571(199009)41:6%3C391::AID-ASI1%3E3.0.CO;2-9"
  },
  {
    "label": "Mikolov et al., Efficient Estimation of Word Representations in Vector Space",
    "url": "https://arxiv.org/abs/1301.3781"
  },
  {
    "label": "Lewis Carroll, Alice’s Adventures in Wonderland (public-domain corpus)",
    "url": "https://www.gutenberg.org/ebooks/11"
  }
]
} satisfies Lesson;

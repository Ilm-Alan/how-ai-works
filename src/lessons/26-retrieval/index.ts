import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "retrieval", title: "Search and RAG", part: "building", body,
  lab: { title: "Words, vectors, and fused ranks", mount },
  quiz: [
    { q: "You need two passages. One is first; the other is missing. What are the scores?", choices: ["Recall is 1", "First-hit score is 1; recall is 0.5", "Both are zero"], answer: 1, why: "First-hit score counts only the first useful result, while recall counts all needed passages." },
    { q: "Word scores are near 8; vector scores are near 0.6. How can you combine them fairly?", choices: ["Treat them as chances", "Ignore word search", "Combine their ranks"], answer: 2, why: "Ranks let you combine results without adding scores on different scales." },
    { q: "A model reorders twenty results, but none has the answer. What can it do?", choices: ["Reorder them, not recover missing evidence", "Create the missing source", "Guarantee a true answer"], answer: 0, why: "Reordering can only use the passages it was given." },
    { q: "A refund rule and its exception land in separate passages. What helps?", choices: ["Raise temperature", "Keep the rule and exception together", "Save the answer in a cache"], answer: 1, why: "Keeping related text together avoids losing a condition that changes the rule." },
  ],
  sources: [
    { label: "Robertson and Zaragoza 2009, The Probabilistic Relevance Framework: BM25 and Beyond", url: "https://dl.acm.org/doi/10.1561/1500000019" },
    { label: "Deerwester et al. 1990, Indexing by Latent Semantic Analysis", url: "http://wordvec.colorado.edu/papers/Deerwester_1990.pdf" },
    { label: "Cormack, Clarke, and Büttcher 2009, Reciprocal Rank Fusion", url: "https://cormack.uwaterloo.ca/cormacksigir09-rrf.pdf" },
    { label: "Anthropic, Effective context engineering for AI agents (accessed October 2026)", url: "https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents" },
  ],
} satisfies Lesson;

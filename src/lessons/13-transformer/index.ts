import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "transformer",
  title: "The transformer",
  part: "language-models",
  body,
  lab: { title: "Rotary position and parameter counts", mount },
  quiz: [
    { q: "Move fixed query and key vectors from positions (7, 2) to (27, 22). What happens to their rotary dot product?", choices: ["It falls", "It doubles", "It stays the same", "It becomes zero"], answer: 2, why: "Both positions move by 20, so their gap stays the same." },
    { q: "A gated inner network uses two input matrices and one output matrix. How many matrices must you count?", choices: ["Three", "Two", "One", "Four"], answer: 0, why: "The gate has its own weights, so all three matrices count." },
    { q: "You let four query heads share one set of keys and values. Which matrices shrink?", choices: ["All four", "Only queries", "Only output", "Keys and values"], answer: 3, why: "Sharing shrinks the key and value matrices, not the query or output matrices." },
    { q: "You reuse the input token table to produce output scores. What changes?", choices: ["Half the tokens disappear", "You save one table but keep every token's score", "Every block loses a table", "Positions become unnecessary"], answer: 1, why: "The two uses share weights, but the vocabulary stays the same size." },
  ],
  sources: [
    { label: "Meta, The Llama 3 Herd of Models (architecture and table 3; historical config checked October 2026)", url: "https://arxiv.org/html/2407.21783v2" },
    { label: "Meta, official Llama 3 implementation (RMSNorm, SwiGLU, RoPE, separate output weights)", url: "https://github.com/meta-llama/llama3/blob/main/llama/model.py" },
    { label: "NousResearch mirror, Meta-Llama-3-8B-Instruct config (exact vocab and untied tables; accessed October 2026)", url: "https://huggingface.co/NousResearch/Meta-Llama-3-8B-Instruct/blob/main/config.json" },
    { label: "Su et al., RoFormer (rotary formulation and relative-position identity)", url: "https://arxiv.org/abs/2104.09864" },
    { label: "Shazeer, GLU Variants Improve Transformer", url: "https://arxiv.org/abs/2002.05202" },
    { label: "Zhang and Sennrich, Root Mean Square Layer Normalization", url: "https://arxiv.org/abs/1910.07467" },
  ],
} satisfies Lesson;

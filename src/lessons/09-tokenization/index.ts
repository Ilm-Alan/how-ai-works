import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  "slug": "tokenization",
  "title": "Tokens",
  "part": "language-models"
,
  body,
  lab: { title: "Train a byte vocabulary", mount },
  quiz: [
  {
    "q": "A new emoji was never in the byte-based tokenizer's training text. Can it still be read?",
    "choices": [
      "No, it must be unknown",
      "Yes, as a sequence of bytes",
      "Only after retraining"
    ],
    "answer": 1,
    "why": "All 256 bytes are available from the start, so learned joins only shorten their sequences."
  },
  {
    "q": "You apply more learned joins to the same text. What stays the same?",
    "choices": [
      "The token count",
      "Each token boundary",
      "The decoded text"
    ],
    "answer": 2,
    "why": "Joining pieces preserves their bytes, so decoding still gives the original text."
  },
  {
    "q": "Two tokens have IDs 42 and 43. What does that tell you?",
    "choices": [
      "Their table rows are next to each other",
      "Their meanings are similar",
      "Their decoded lengths match"
    ],
    "answer": 0,
    "why": "IDs are row numbers, not a measure of meaning."
  }
],
  sources: [
  {
    "label": "Sennrich et al., Neural Machine Translation of Rare Words with Subword Units",
    "url": "https://arxiv.org/abs/1508.07909"
  },
  {
    "label": "OpenAI tiktoken vocabulary and special-token definitions (accessed October 2026)",
    "url": "https://github.com/openai/tiktoken/blob/main/tiktoken_ext/openai_public.py"
  },
  {
    "label": "OpenAI o200k_base mergeable vocabulary (199,998 entries)",
    "url": "https://openaipublic.blob.core.windows.net/encodings/o200k_base.tiktoken"
  },
  {
    "label": "Meta, Llama 3 tokenizer vocabulary",
    "url": "https://ai.meta.com/blog/meta-llama-3/"
  },
  {
    "label": "Qwen3-8B tokenizer data (accessed October 2026)",
    "url": "https://huggingface.co/Qwen/Qwen3-8B/blob/main/tokenizer.json"
  },
  {
    "label": "Google, Gemma 3 tokenizer and embedding dimensions",
    "url": "https://developers.googleblog.com/en/gemma-explained-whats-new-in-gemma-3/"
  },
  {
    "label": "OpenAI, token length rule of thumb",
    "url": "https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them"
  },
  {
    "label": "Lewis Carroll, Alice’s Adventures in Wonderland (public-domain corpus)",
    "url": "https://www.gutenberg.org/ebooks/11"
  }
]
} satisfies Lesson;

import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "prompting-and-context", title: "Prompts and context", part: "building", body,
  lab: { title: "A stable prefix has a price", mount },
  quiz: [
    { q: "A timestamp before the cache breakpoint changes every turn. What happens?", choices: ["Only the timestamp costs money", "The prefix must be written again", "The old answer is returned"], answer: 1, why: "A cache hit needs the whole prefix through the breakpoint to match." },
    { q: "You use caching for just one request. Why might it cost more?", choices: ["The answer is generated twice", "Reads use the output price", "A write costs more than normal input"], answer: 2, why: "The default write price is $2.50 per million tokens instead of $2 for normal input." },
    { q: "A model finds one sentence in a huge document. Does that prove it can reason across conflicting documents?", choices: ["No, that tests a different skill", "Yes, every detail now has equal weight", "Yes, summaries cannot lose facts"], answer: 0, why: "Finding a sentence does not test how the model handles conflicting evidence." },
    { q: "A summary turns a guessed customer ID into a confirmed fact. What should you change?", choices: ["Allow a longer answer", "Mark guesses and keep links to the raw record", "Repeat the summary"], answer: 1, why: "Keeping a claim's status and source helps prevent a summary from hiding uncertainty." },
  ],
  sources: [
    { label: "Brown et al. 2020, Language Models are Few-Shot Learners", url: "https://arxiv.org/abs/2005.14165" },
    { label: "Chroma 2025, Context Rot (historical study)", url: "https://www.trychroma.com/research/context-rot" },
    { label: "Anthropic prompt caching: prefix rules, TTL, thresholds, and pricing (accessed October 2026)", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-caching" },
  ],
} satisfies Lesson;

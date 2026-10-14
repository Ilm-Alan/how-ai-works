import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "safety-and-security",
  title: "Failure modes, safety, security",
  part: "building",
  body,
  lab: { title: "Find the attack paths", mount },
  quiz: [
    {
      q: "An inbox agent can read and send mail. What best blocks a malicious email from causing a leak?",
      choices: [
        "Add a warning to its prompt",
        "Require approval before sending",
        "Use a larger model",
      ],
      answer: 1,
      why: "Checking each send request can block a leak even when malicious text tricks the model.",
    },
    {
      q: "A test gives no credit for 'I don't know.' Why might a model guess?",
      choices: [
        "All test answers are false",
        "A guess can earn credit; skipping cannot",
        "The test is too easy",
      ],
      answer: 1,
      why: "Without a cost for confident errors, guessing can score better than admitting uncertainty.",
    },
    {
      q: "An agent can run shell commands. Its web tool allows only fixed hosts. Can private data still leak?",
      choices: ["No", "Yes, if the shell can reach the network", "Only if it can edit files"],
      answer: 1,
      why: "Rules for the web tool do not block the shell's own network access.",
    },
    {
      q: "Researchers penalized written thinking that revealed cheating. What happened?",
      choices: ["Cheating stopped", "Models still cheated but hid it", "Models refused every task"],
      answer: 1,
      why: "Making the thinking look clean hid the warning signal without stopping cheating.",
    },
  ],
  sources: [
    { label: "Kalai et al. 2025, Why Language Models Hallucinate", url: "https://arxiv.org/abs/2509.04664" },
    { label: "OpenAI, Sycophancy in GPT-4o (Apr 2025)", url: "https://openai.com/index/sycophancy-in-gpt-4o/" },
    { label: "Willison 2025, The lethal trifecta for AI agents", url: "https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/" },
    { label: "Debenedetti et al. 2025, Defeating Prompt Injections by Design (CaMeL)", url: "https://arxiv.org/abs/2503.18813" },
    { label: "Beurer-Kellner et al. 2025, Design Patterns for Securing LLM Agents against Prompt Injections", url: "https://arxiv.org/abs/2506.08837" },
    { label: "Google, Gemini 4 Argon (layered prompt-injection defenses), Sept 2026", url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/gemini-4-argon/" },
    { label: "Greenblatt et al. 2024, Alignment faking in large language models", url: "https://arxiv.org/abs/2412.14093" },
    { label: "Anthropic 2025, Natural emergent misalignment from reward hacking", url: "https://www.anthropic.com/research/emergent-misalignment-reward-hacking" },
    { label: "OpenAI 2025, Detecting misbehavior in frontier reasoning models (CoT monitoring)", url: "https://openai.com/index/chain-of-thought-monitoring/" },
  ],
} satisfies Lesson;

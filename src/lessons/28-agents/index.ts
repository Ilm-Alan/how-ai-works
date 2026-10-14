import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "agents",
  title: "Agents",
  part: "building",
  body,
  lab: { title: "Why reliability compounds", mount },
  quiz: [
    {
      q: "Each step works 98% of the time, independently. How often do all 100 steps work without checks?",
      choices: ["98%", "50%", "13%", "2%"],
      answer: 2,
      why: "0.98¹⁰⁰ is about 0.13, so small errors add up across many steps.",
    },
    {
      q: "A model succeeds half the time on 12-hour tasks, but 80% on 70-minute tasks. What follows?",
      choices: [
        "The test is broken",
        "Reliable tasks must be much shorter",
        "The model is faster than people",
      ],
      answer: 1,
      why: "Asking for a higher success rate sharply reduces the task length it can handle.",
    },
    {
      q: "Which change helps a long task succeed in the lab?",
      choices: ["Remove retries", "Catch errors and retry twice", "Add more steps"],
      answer: 1,
      why: "A caught error gets another try instead of silently spoiling the task.",
    },
    {
      q: "Why are tests useful to a coding agent?",
      choices: ["They shorten the code", "They quickly reveal errors", "They write every fix"],
      answer: 1,
      why: "Fast, trustworthy feedback turns silent errors into caught-and-fixed ones.",
    },
  ],
  sources: [
    { label: "METR, Time horizons (methodology and limitations)", url: "https://metr.org/time-horizons/" },
    { label: "METR, Time horizon 1.1 benchmark results (data, last updated Sept 2026)", url: "https://metr.org/assets/benchmark_results_1_1.yaml" },
    { label: "Anthropic, Claude Sonnet 5.5 (Terminal-Bench 4.0, OSWorld 2.1)", url: "https://www.anthropic.com/claude-sonnet-5-5" },
    { label: "Linux Foundation, Agentic AI Foundation formation (MCP, AGENTS.md), Dec 2025", url: "https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation" },
    { label: "Anthropic, Equipping agents for the real world with Agent Skills", url: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills" },
  ],
} satisfies Lesson;

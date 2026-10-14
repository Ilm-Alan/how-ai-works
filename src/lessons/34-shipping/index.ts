import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "shipping",
  title: "Shipping an AI feature",
  part: "frontier",
  body,
  lab: { title: "API or self-hosted?", mount },
  quiz: [
    {
      q: "A new model version looks fine on five inputs. What should happen before release?",
      choices: ["Ship it now", "Run the full eval set against the current version", "Raise the temperature"],
      answer: 1,
      why: "A model update can break cases that a few manual tries miss.",
    },
    {
      q: "Your rented GPU is busy only 25% of the time. How does cost per request compare with full use?",
      choices: ["It stays the same", "It is about four times higher", "It is lower"],
      answer: 1,
      why: "You pay for the idle hours too, so doing a quarter as much work costs four times as much per request.",
    },
    {
      q: "How should you choose a model for a new feature?",
      choices: [
        "Pick the cheapest before testing",
        "Start strong, then find the cheapest setup that passes",
        "Use the public ranking winner",
      ],
      answer: 1,
      why: "Starting strong shows whether the task works; stepping down finds a cheaper setup that still meets your bar.",
    },
    {
      q: "An agent feature averages 40 model calls per task. Where should cost be measured?",
      choices: ["Per call", "Per task, summing every call", "Per output token only"],
      answer: 1,
      why: "The total cost of all forty calls is what one completed task costs.",
    },
  ],
  sources: [
    { label: "OpenAI, Batch API (50% lower costs)", url: "https://developers.openai.com/api/docs/guides/batch" },
    { label: "Anthropic, Message Batches API", url: "https://docs.anthropic.com/en/docs/build-with-claude/batch-processing" },
    { label: "OpenAI, Introducing GPT-6.1 Sol (GPT-6 Luna and Astra prices), Sept 2026", url: "https://openai.com/index/introducing-gpt-6-1-sol/" },
    { label: "SemiAnalysis InferenceX, gpt-oss-120b on H100 (measured throughput, 2026)", url: "https://inferencex.semianalysis.com/run/gptoss-120b-on-h100" },
    { label: "GPU Economy, H100 SXM vs B200 rental prices (Oct 14, 2026)", url: "https://gpueconomy.com/gpus/h100-sxm-vs-b200" },
    { label: "OpenAI, Video generation guide (Sora 2 API shutdown)", url: "https://developers.openai.com/api/docs/guides/video-generation" },
  ],
} satisfies Lesson;

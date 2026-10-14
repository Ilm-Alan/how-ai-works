import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "the-landscape",
  title: "The field in 2026",
  part: "frontier",
  body,
  lab: { title: "Fit and extrapolate a trend", mount },
  quiz: [
    {
      q: "A model stores 1.6 trillion weights but uses 49 billion per token. What does that mean?",
      choices: [
        "Each token uses a subset, but all weights still need storage",
        "Each token uses all the weights",
        "Only 49 billion weights need storage",
      ],
      answer: 0,
      why: "Selecting a few parts per token saves work, not storage for the other parts.",
    },
    {
      q: "A lab releases weights under Apache-2.0 but no training code or data information. Is that open-source AI?",
      choices: ["Yes, because of the license", "No, open weights alone are not enough", "Only if the model is small"],
      answer: 1,
      why: "The Open Source Initiative also requires code and enough data information to rebuild a similar system.",
    },
    {
      q: "Changing the fit start from 2023 to 2019 changes doubling time from 129 to 192 days. What should you learn?",
      choices: [
        "One fit must be wrong",
        "Forecasts depend on which past data you fit",
        "Always discard earlier data",
      ],
      answer: 1,
      why: "Both windows fit real data, but lead to very different forecasts.",
    },
    {
      q: "What must an open-weight model provider publish under the EU AI Act?",
      choices: ["Nothing", "A training-content summary and copyright policy", "The full training dataset"],
      answer: 1,
      why: "Those duties also apply to open-weight providers.",
    },
  ],
  sources: [
    { label: "OpenAI, Introducing GPT-6.1 Sol (Sept 2026)", url: "https://openai.com/index/introducing-gpt-6-1-sol/" },
    { label: "Anthropic, Claude Sonnet 5.5 (Sept 2026)", url: "https://www.anthropic.com/claude-sonnet-5-5" },
    { label: "Google, Introducing Gemini 4 Argon (Sept 2026)", url: "https://blog.google/innovation-and-ai/models-and-research/gemini-models/introducing-gemini-4-argon/" },
    { label: "xAI, Grok 4.7 (Sept 2026)", url: "https://x.ai/news/grok-4-7" },
    { label: "DeepSeek-V4-Pro model card", url: "https://huggingface.co/deepseek-ai/DeepSeek-V4-Pro" },
    { label: "Moonshot AI, Kimi K3 model card", url: "https://huggingface.co/moonshotai/Kimi-K3" },
    { label: "Z.ai, GLM-5 (Feb 2026)", url: "https://z.ai/blog/glm-5" },
    { label: "Mistral AI, Mistral 3 (Dec 2025)", url: "https://mistral.ai/news/mistral-3/" },
    { label: "OpenAI, Introducing gpt-oss (Aug 2025)", url: "https://openai.com/index/introducing-gpt-oss/" },
    { label: "Qwen, Qwen3.8-27B model card", url: "https://huggingface.co/Qwen/Qwen3.8-27B" },
    { label: "Open Source Initiative, Open Source AI Definition 1.0", url: "https://opensource.org/ai/open-source-ai-definition" },
    { label: "METR, Time horizons: methodology and limitations", url: "https://metr.org/time-horizons/" },
    { label: "METR, Time Horizon 1.1 results data", url: "https://metr.org/assets/benchmark_results_1_1.yaml" },
    { label: "Epoch AI, Notable AI Models", url: "https://epoch.ai/data/notable-ai-models" },
    { label: "Alphabet Q4 2025 earnings call (capex, Gemini serving cost)", url: "https://abc.xyz/investor/events/event-details/2026/2025-Q4-Earnings-Call-2026-Dr%5FC033hS6/default.aspx" },
    { label: "IEA 2025, AI is set to drive surging electricity demand from data centres", url: "https://www.iea.org/news/ai-is-set-to-drive-surging-electricity-demand-from-data-centres-while-offering-the-potential-to-transform-how-the-energy-sector-works" },
    { label: "European Commission, Guidelines on obligations for general-purpose AI providers", url: "https://digital-strategy.ec.europa.eu/en/faqs/guidelines-obligations-general-purpose-ai-providers" },
  ],
} satisfies Lesson;

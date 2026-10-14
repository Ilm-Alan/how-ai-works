import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "reasoning-models", title: "Reasoning models", part: "training", body,
  lab: { title: "Vote or verify?", mount },
  quiz: [
    { q: "A model is right 40% of the time; its two possible wrong answers come up 30% each. What happens if you ask it many times and take a vote?", choices: ["Voting fails because 40% is under half", "Voting picks the right answer more and more often", "Voting does no better than one try"], answer: 1, why: "Voting only needs the right answer to be the most common one, and 40% beats each 30%." },
    { q: "A perfect checker looks at 5 tries, each right 30% of the time. How often does it find a right answer?", choices: ["30%", "0.3⁵, under 1%", "1 − 0.7⁵, about 83%"], answer: 2, why: "It fails only if all five tries are wrong: 0.7⁵ ≈ 17%." },
    { q: "A model's chain of thought looks clean. What does that tell you?", choices: ["Not much on its own: models trained to hide bad plans can still act on them", "The model is behaving safely", "The answer is correct"], answer: 0, why: "OpenAI found that penalizing bad thoughts made models hide them, not stop." },
    { q: "The highest thinking setting scores worse than the next one down on your task. What should you do?", choices: ["Use the highest setting anyway", "Test several settings on your task and pick on accuracy, speed, and cost", "Turn thinking off"], answer: 1, why: "More thinking can overcomplicate or time out; the best setting depends on the task." },
  ],
  sources: [
    { label: "OpenAI, Learning to reason with LLMs (o1 historical release)", url: "https://openai.com/index/learning-to-reason-with-llms/" },
    { label: "DeepSeek, R1 recipe and report", url: "https://github.com/deepseek-ai/DeepSeek-R1" },
    { label: "Wang et al., Self-consistency", url: "https://arxiv.org/abs/2203.11171" },
    { label: "OpenAI, gpt-oss reasoning levels", url: "https://openai.com/index/introducing-gpt-oss/" },
    { label: "DeepSeek V4.1 Flash card, September 2026", url: "https://huggingface.co/deepseek-ai/DeepSeek-V4.1-Flash" },
    { label: "Anthropic, Sonnet 5.5 effort results, September 2026", url: "https://www.anthropic.com/claude-sonnet-5-5" },
    { label: "OpenAI, Chain-of-thought monitoring, March 2025", url: "https://openai.com/index/chain-of-thought-monitoring/" },
  ],
} satisfies Lesson;

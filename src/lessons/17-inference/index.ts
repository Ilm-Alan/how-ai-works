import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "inference",
  title: "Running a model: inference",
  part: "language-models",
  body,
  lab: { title: "Draft length versus useful output", mount },
  quiz: [
    { q: "All four draft tokens pass a check. Including the main model's extra token, how many can it emit?", choices: ["One", "Four", "Five", "Eight"], answer: 2, why: "It keeps the four draft tokens and adds one of its own." },
    { q: "Why can a longer draft make an answer slower?", choices: ["More guesses are discarded, but still cost work", "A rejection always emits nothing", "Attention stops hiding the future", "A passing chance must exceed one"], answer: 0, why: "Later guesses are less likely to survive, while their drafting cost keeps growing." },
    { q: "A bigger batch produces more total tokens per second. What does this prove about one user's wait?", choices: ["The first token arrives sooner", "Every later token arrives sooner", "The answer's probabilities change", "None of these"], answer: 3, why: "Sharing weight reads can raise total output without making one answer faster." },
    { q: "You want draft guesses to leave the main model's output probabilities unchanged. What should you use?", choices: ["Accept plausible words", "The probability-based acceptance and correction rule", "Trust a confident draft", "Skip checks on short words"], answer: 1, why: "The acceptance rule and correction together preserve the main model's probabilities." },
  ],
  sources: [
    { label: "Leviathan et al. (2023), Fast Inference from Transformers via Speculative Decoding, equations 1 and 4", url: "https://proceedings.mlr.press/v202/leviathan23a.html" },
    { label: "vLLM documentation (accessed October 2026), serving features", url: "https://docs.vllm.ai/en/latest/" },
    { label: "SGLang documentation (accessed October 2026), prefill/decode disaggregation", url: "https://docs.sglang.ai/advanced_features/pd_disaggregation.html" },
    { label: "NVIDIA TensorRT-LLM documentation (accessed October 2026), in-flight batching and paged attention", url: "https://nvidia.github.io/TensorRT-LLM/features/paged-attention-ifb-scheduler.html" },
    { label: "DeepSeek-V3 technical report, multi-token prediction and speculative decoding", url: "https://arxiv.org/abs/2412.19437" },
  ],
} satisfies Lesson;

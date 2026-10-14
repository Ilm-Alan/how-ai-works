import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "preference-and-rl", title: "Preferences and reinforcement learning", part: "training", body,
  lab: { title: "Optimizing the wrong reward", mount },
  quiz: [
    { q: "The reward score rises while an outside quality check falls. What has the model learned?", choices: ["Reward always equals quality", "To stop learning", "To exploit the scorer"], answer: 2, why: "Training follows the supplied score even when it rewards behavior you do not want." },
    { q: "You raise change penalty in the lab. What does it do?", choices: ["Makes moving from the starting policy cost more", "Replaces reward with truth", "Makes every answer correct"], answer: 0, why: "The penalty limits changes in answer chances, not mistakes." },
    { q: "Every answer in a sampled group gets the same score. Which answer does that comparison favor?", choices: ["Every answer strongly", "None", "The longest answer"], answer: 1, why: "Equal scores give no signal about which answer is better than the group." },
    { q: "You have pairs of preferred and rejected answers but no reward model. Which method can use them directly?", choices: ["Only a method with a second scorer", "No training method", "DPO"], answer: 2, why: "DPO learns from preferred and rejected pairs without fitting a separate reward model." },
  ],
  sources: [
    { label: "Ouyang et al., InstructGPT and RLHF", url: "https://arxiv.org/abs/2203.02155" },
    { label: "Rafailov et al., Direct preference optimization", url: "https://arxiv.org/abs/2305.18290" },
    { label: "DeepSeek-R1 report (GRPO)", url: "https://arxiv.org/abs/2501.12948" },
    { label: "DAPO, March 2025", url: "https://arxiv.org/html/2503.14476v2" },
    { label: "GSPO, July 2025", url: "https://arxiv.org/html/2507.18071v2" },
    { label: "Meta, Llama 4 SFT / online RL / DPO recipe", url: "https://ai.meta.com/blog/Llama-4-multimodal-intelligence/" },
    { label: "Z.ai release notes, GLM-5.1 process/outcome evaluation", url: "https://docs.z.ai/release-notes/new-released" },
  ],
} satisfies Lesson;

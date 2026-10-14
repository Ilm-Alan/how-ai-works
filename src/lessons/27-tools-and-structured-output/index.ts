import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";
export default {
  slug: "tools-and-structured-output", title: "Tools and structured output", part: "building", body,
  lab: { title: "A grammar changes the sampling distribution", mount },
  quiz: [
    { q: "The model returns a valid call to delete a file. What has happened?", choices: ["The file is gone", "It proposed a call for the app to check", "The user approved it"], answer: 1, why: "Your app must check permission and run the call before anything changes." },
    { q: "Format rules produce an object with limit 3. What do they prove?", choices: ["3 is the best choice", "The source is right", "The object follows the rules"], answer: 2, why: "Format rules control fields and values, not whether a choice fits the task." },
    { q: "Allowed tokens have total chance 0.2. One has chance 0.05. What is its chance after blocking the rest?", choices: ["0.25", "0.05", "0.01"], answer: 0, why: "Its new chance is 0.05 divided by 0.2, or 0.25." },
    { q: "You need workflow steps plus access to a remote service. Which fits?", choices: ["MCP writes every step", "A skill gives steps; MCP connects tools", "A skill grants permission"], answer: 1, why: "Skills package guidance, while MCP connects apps to tools." },
  ],
  sources: [
    { label: "OpenAI 2024, Introducing Structured Outputs: masking, CFGs, and limitations (historical mechanism source)", url: "https://openai.com/index/introducing-structured-outputs-in-the-api/" },
    { label: "MCP architecture documentation (accessed October 2026)", url: "https://modelcontextprotocol.io/docs/learn/architecture" },
    { label: "Linux Foundation, AAIF formation and MCP contribution, December 2025", url: "https://www.linuxfoundation.org/press/linux-foundation-announces-the-formation-of-the-agentic-ai-foundation" },
    { label: "Anthropic, Agent Skills; open-standard update December 18, 2025", url: "https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills" },
  ],
} satisfies Lesson;

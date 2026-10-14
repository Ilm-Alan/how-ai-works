import type { Lesson } from "../../types";
import { mount } from "./lab";
import body from "./lesson.md" with { type: "text" };

export default {
  slug: "diffusion",
  title: "Generating images: diffusion and flow",
  part: "building",
  body,
  lab: { title: "From noise to data", mount },
  quiz: [
    {
      q: "In the lab, you take one step from pure noise. Where do the points land?",
      choices: ["On random data points", "At the mean of the data", "Still in pure noise", "In sharp clusters"],
      answer: 1,
      why: "At t = 1 the noise says nothing about which image it came from, so the best single prediction is the mean.",
    },
    {
      q: "You train a flow model on an image mixed with noise. What must it predict?",
      choices: [
        "The next pixel",
        "Whether the image is real",
        "The direction as more noise is added",
      ],
      answer: 2,
      why: "The model learns this direction during training, then follows it backward to make an image.",
    },
    {
      q: "You raise guidance scale to match a prompt more strongly. What tradeoff should you expect?",
      choices: ["More variety", "Closer prompt matching but less variety", "More pixels", "Fewer steps"],
      answer: 1,
      why: "Stronger guidance pushes samples toward the prompt and can exaggerate its features.",
    },
    {
      q: "A generator shrinks an image to a latent before removing noise. Why?",
      choices: ["To make captions easier", "To do less work at each step", "Because pixels cannot hold noise"],
      answer: 1,
      why: "A 512×512×3 image has far more values than a 64×64×4 latent.",
    },
  ],
  sources: [
    { label: "Ho et al. 2020, Denoising Diffusion Probabilistic Models", url: "https://arxiv.org/abs/2006.11239" },
    { label: "Lipman et al. 2022, Flow Matching for Generative Modeling", url: "https://arxiv.org/abs/2210.02747" },
    { label: "Liu et al. 2022, Flow Straight and Fast: Rectified Flow", url: "https://arxiv.org/abs/2209.03003" },
    { label: "Ho & Salimans 2022, Classifier-Free Diffusion Guidance", url: "https://arxiv.org/abs/2207.12598" },
    { label: "Rombach et al. 2021, High-Resolution Image Synthesis with Latent Diffusion Models", url: "https://arxiv.org/abs/2112.10752" },
    { label: "Esser et al. 2024, Scaling Rectified Flow Transformers for High-Resolution Image Synthesis (SD3)", url: "https://arxiv.org/abs/2403.03206" },
    { label: "Black Forest Labs, FLUX.1 [schnell] model card", url: "https://github.com/black-forest-labs/flux/blob/main/model_cards/FLUX.1-schnell.md" },
    { label: "Google DeepMind, Veo", url: "https://deepmind.google/models/veo/" },
    { label: "OpenAI, Video generation guide (Sora 2 API shutdown notice)", url: "https://developers.openai.com/api/docs/guides/video-generation" },
    { label: "Z.ai, GLM-Image architecture", url: "https://docs.z.ai/guides/image/glm-image" },
  ],
} satisfies Lesson;

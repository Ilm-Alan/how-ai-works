import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "neural-networks",
  title: "Neural networks",
  part: "basics",
  body,
  lab: { title: "Learn a decision boundary", mount },
  quiz: [
    { q: "A network with linear activation fails on XOR. Which change can let it draw a curved split?", choices: ["Add more linear layers", "Use a hidden activation that bends values", "Train the linear network longer"], answer: 1, why: "Linear layers still make one linear map, while a bending activation can combine regions." },
    { q: "A network fits every training dot. What do you know?", choices: ["It fits these examples", "It will get every new dot right", "Its confidence is always reliable"], answer: 0, why: "A training score alone does not tell you how the model handles new examples." },
    { q: "A layer has 5 inputs and 8 neurons, each with a bias. How many numbers does it learn?", choices: ["13", "40", "48", "64"], answer: 2, why: "It learns 5 × 8 weights plus 8 biases, for 48 numbers." },
    { q: "Your network is wide enough to express a good rule. What can still go wrong?", choices: ["It cannot express any smooth rule", "Hidden bends always reduce its range", "Training may not find the right weights"], answer: 2, why: "Being able to express a rule does not ensure training will find it from the data." },
  ],
  sources: [
    { label: "Goodfellow, Bengio, Courville, Deep Learning: Deep Feedforward Networks", url: "https://www.deeplearningbook.org/contents/mlp.html" },
    { label: "Hendrycks and Gimpel, Gaussian Error Linear Units", url: "https://arxiv.org/abs/1606.08415" },
    { label: "Shazeer, GLU Variants Improve Transformer", url: "https://arxiv.org/abs/2002.05202" },
  ],
} satisfies Lesson;

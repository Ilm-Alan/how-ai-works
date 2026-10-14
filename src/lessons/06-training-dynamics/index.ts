import type { Lesson } from "../../types";
import body from "./lesson.md" with { type: "text" };
import { mount } from "./lab";

export default {
  slug: "training-dynamics",
  title: "Making deep networks train",
  part: "basics",
  body,
  lab: { title: "Follow gradients through twenty layers", mount },
  quiz: [
    { q: "Loss is high, but the first layer's gradient is almost zero. What might be wrong?", choices: ["The first layer must be perfect", "The training signal fades before reaching it", "The test labels must be wrong"], answer: 1, why: "A tiny gradient can mean a weak signal, not successful learning." },
    { q: "You add each layer's input to its learned change. Why can this help?", choices: ["It gives gradients a direct route", "Every slope becomes one", "It removes all bends"], answer: 0, why: "The input can pass around the learned branch rather than only through it." },
    { q: "You make tanh's starting weights much larger, but gradients stay small. Why?", choices: ["Tanh becomes linear", "The network loses weights", "Tanh can become nearly flat at large inputs"], answer: 2, why: "Large inputs can push tanh into a flat region with a tiny slope." },
    { q: "Training loss falls while validation loss rises. What should you try?", choices: ["Pick an earlier saved model using validation scores", "Report training loss only", "Assume direct routes prevent overfitting"], answer: 0, why: "Early stopping chooses a model before its fit to training noise gets worse." },
  ],
  sources: [
    { label: "Glorot and Bengio, Understanding the difficulty of training deep feedforward neural networks", url: "https://proceedings.mlr.press/v9/glorot10a.html" },
    { label: "He et al., Deep Residual Learning for Image Recognition", url: "https://arxiv.org/abs/1512.03385" },
    { label: "Ba, Kiros, Hinton, Layer Normalization", url: "https://arxiv.org/abs/1607.06450" },
    { label: "Zhang and Sennrich, Root Mean Square Layer Normalization", url: "https://arxiv.org/abs/1910.07467" },
    { label: "Goodfellow, Bengio, Courville, Deep Learning: Regularization", url: "https://www.deeplearningbook.org/contents/regularization.html" },
    { label: "Power et al., Grokking: Generalization Beyond Overfitting on Small Algorithmic Datasets", url: "https://arxiv.org/abs/2201.02177" },
  ],
} satisfies Lesson;

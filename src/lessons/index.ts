import type { Lesson, Part } from "../types";
import learningFromData from "./01-learning-from-data";
import mathYouNeed from "./02-math-you-need";
import gradientDescent from "./03-gradient-descent";
import neuralNetworks from "./04-neural-networks";
import backpropagation from "./05-backpropagation";
import trainingDynamics from "./06-training-dynamics";
import measuringModels from "./07-measuring-models";
import hardwareAndPrecision from "./08-hardware-and-precision";
import tokenization from "./09-tokenization";
import embeddings from "./10-embeddings";
import nextTokenPrediction from "./11-next-token-prediction";
import attention from "./12-attention";
import transformer from "./13-transformer";
import trainATinyLm from "./14-train-a-tiny-lm";
import scalingLaws from "./15-scaling-laws";
import modernArchitectures from "./16-modern-architectures";
import inference from "./17-inference";
import pretrainingData from "./18-pretraining-data";
import trainingRun from "./19-training-run";
import instructionTuning from "./20-instruction-tuning";
import preferenceAndRl from "./21-preference-and-rl";
import reasoningModels from "./22-reasoning-models";
import efficientAdaptation from "./23-efficient-adaptation";
import quantization from "./24-quantization";
import promptingAndContext from "./25-prompting-and-context";
import retrieval from "./26-retrieval";
import toolsAndStructuredOutput from "./27-tools-and-structured-output";
import agents from "./28-agents";
import safetyAndSecurity from "./29-safety-and-security";
import multimodal from "./30-multimodal";
import diffusion from "./31-diffusion";
import evaluatingLlms from "./32-evaluating-llms";
import interpretability from "./33-interpretability";
import shipping from "./34-shipping";
import theLandscape from "./35-the-landscape";

export const parts: Part[] = [
  { id: "basics", title: "Foundations" },
  { id: "language-models", title: "Language models" },
  { id: "training", title: "Training LLMs" },
  { id: "building", title: "Building with models" },
  { id: "frontier", title: "Evaluating and understanding" },
];

export const lessons: Lesson[] = [
  learningFromData,
  mathYouNeed,
  gradientDescent,
  neuralNetworks,
  backpropagation,
  trainingDynamics,
  measuringModels,
  hardwareAndPrecision,
  tokenization,
  embeddings,
  nextTokenPrediction,
  attention,
  transformer,
  trainATinyLm,
  scalingLaws,
  modernArchitectures,
  inference,
  pretrainingData,
  trainingRun,
  instructionTuning,
  preferenceAndRl,
  reasoningModels,
  efficientAdaptation,
  quantization,
  promptingAndContext,
  retrieval,
  toolsAndStructuredOutput,
  agents,
  safetyAndSecurity,
  multimodal,
  diffusion,
  evaluatingLlms,
  interpretability,
  shipping,
  theLandscape,
];

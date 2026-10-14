A base model continues text. Ask “What is 3 × 7?” and it might write another question. To make it act like an assistant, train it on examples of good answers. This is **supervised fine-tuning**. The network can stay the same; the examples change its weights.

## Mark who said what

The app stores messages, but the model reads one stream of tokens. A **chat template** adds markers for who is speaking and where messages end. These markers are part of what the model learned. Use the format it was trained with.

Llama 3 Instruct marks user and assistant turns with role headers. OpenAI's gpt-oss uses a format called Harmony. It also marks when an assistant hands control to a tool. A tool's reply is not an assistant's answer.

{{lab}}

Leave train assistant only on. Switch format from Llama 3 Instruct to gpt-oss Harmony: both train on 7 teaching tokens in the Text example. Turn train assistant only off to train on 29. Headers still do not receive a training score. Select Tool example (Harmony) to see the assistant's tool call and the tool's reply. Underlined tokens are the ones being taught. These counts split words and punctuation for display, rather than using a real model's token rules.

## Choose what to teach

Each training position predicts the next token. A **loss mask** chooses which of those predictions count toward the training score. With assistant-only training, user and system text still give context. The model reads them, but does not learn to imitate their words as answers.

An assistant's answer, its stop marker, and its tool call can all be training targets. A tool result usually serves as context. Masking a target does not remove it from the input or stop the model from attending to it.

## Check the behavior

A system prompt guides one request without changing weights. Fine-tuning changes weights across many examples. Neither creates a hard security boundary.

Use correct answers, clear roles, and valid tool calls. Test on conversations kept out of training. Include cases where the model should refuse or should not call a tool. A low training score can mean it memorized the examples.

Training on one narrow task can weaken old skills. This is **catastrophic forgetting**. Mix tasks and check both old and new skills before and after training.

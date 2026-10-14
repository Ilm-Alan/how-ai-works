Bigger models and more training text tend to lower loss in a smooth, predictable way. Fits to these trends are called **scaling laws**. Labs use small runs to choose the size and data budget of a much larger run.

## Split a fixed budget

For a dense model, the rough training cost is:

$$C \approx 6ND.$$

Here, $N$ is the number of weights and $D$ is the number of training tokens. The cost counts floating-point operations, or **FLOPs**. At the same cost, doubling the weights means halving the tokens.

Both size and data help, so either extreme wastes the budget. The split with the lowest predicted loss is **compute-optimal**: best for that training cost.

{{lab}}

Set training budget (log₁₀ operations) to 22. Keep model size / best size at 1. The fit picks about 9 billion weights and 184 billion tokens. Set the size ratio to about 0.5. You get twice the tokens, and loss rises by only about 0.01. The curve is flat near its best point.

The lab uses Epoch AI's 2024 refit of the Chinchilla study. It gives roughly 20 tokens per weight. The original paper's printed constants give 40–100, at odds with its other two methods. The refit resolves that mismatch.

## Training cost is not the whole bill

A model also costs money each time it answers. A smaller model trained on more text can cost much less to serve, with only a small loss penalty.

Llama 3 8B trained on 15 trillion tokens in 2024: about 1,900 per weight. In 2026, GLM-5 and DeepSeek V4.1 Flash report 28–45 trillion training tokens. With expert models, each token uses only some weights, so the ratio to those active weights reaches thousands. The training optimum is a guide, not a universal target.

## What a curve cannot promise

Good text runs out. Reusing it for up to about four passes can work nearly as well as fresh text. After that, gains shrink.

Loss is not the same as skill. A test that marks only whole answers can turn small gains into a sudden score jump. Some claims of new abilities vanish when scores give partial credit; others remain.

Each fit also depends on its text, tokenizer, and model design. Better data can shift the curve. Spending more time on an answer can help too, as we will see in *Reasoning models*.

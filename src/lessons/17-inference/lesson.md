Running a model has two stages. First it reads the whole prompt: **prefill**. Then it writes one token at a time: **decode**. Each new token depends on the last, so these stages have different speed limits.

## Reading is not writing

While reading, the model can use each weight across many prompt positions. It does lots of math for each byte fetched. It also saves old keys and values in the **key/value cache**, so it can reuse them later.

While writing one answer, the model fetches many weights to do little math with each. Moving bytes from memory often sets the limit. At 2 terabytes per second with 16 gigabytes of weights, the limit is 125 tokens per second. Smaller weight formats can help.

Running several answers together shares a weight read. This is **batching**. It raises total output, but need not make one user's answer faster. In **continuous batching**, requests join and leave after each step rather than waiting for a whole batch to finish.

## Check several guesses at once

A cheap model can propose several tokens. The main model checks them in one pass, keeps an accepted prefix, and adds a token of its own. This is **speculative decoding**.

The acceptance rule compares both models' probabilities and corrects rejected guesses. Done correctly, this keeps the main model's output distribution unchanged. Extra prediction heads can also supply drafts.

{{lab}}

Set chance a draft token passes to 0.8, draft tokens to 4, and draft token cost to 0.1. Leave check cost at 1. Each check gives 3.36 tokens on average, for about 2.4 times the speed. Now set chance a draft token passes to 0.5 and draft tokens to 16. It is slower than plain decoding: too many guesses get thrown away.

In the memory panel, keep memory bandwidth (TB/s) at 2 and weights (GB) at 16. Set batch size to 16 and cache read per answer (GB) to 0.5. The limit is about 1,333 tokens per second total, but only 83 per answer.

## Measure the wait, not just the total

Users care about the wait for the first token and the gap between later tokens. Operators also track total tokens per second. A bigger batch can improve the total while making users wait longer.

Saving a shared prompt's cache lets later requests skip part of prefill. Some servers run reading and writing on separate device pools. In October 2026, vLLM documents both tools; SGLang documents separate pools. NVIDIA's TensorRT-LLM documents continuous batching and cache management.

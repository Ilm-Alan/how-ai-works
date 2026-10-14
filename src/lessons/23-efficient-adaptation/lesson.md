To adapt a model, first try clearer prompts or give it the right documents. Train it further when you need a skill, style, or format across many calls. This is **fine-tuning**. Training every weight costs a lot of memory, so there are cheaper ways.

## Train a small change

Freeze the base weights and learn a change made from two thin matrices. This is **low-rank adaptation**, or **LoRA**. The number of directions in that change is its **rank**. A small rank can express a simple change with far fewer numbers than a full weight matrix.

The bet is that the change needs only a few directions. It does not assume the base weights are simple. One thin matrix starts at zero, so the model starts with its original behavior.

{{lab}}

Set matrix to a fine-tuning update and rank to 4. The thin matrices store about 8% of the numbers and leave about 9% error. Most of the useful change fits in four directions. Switch to pure noise: a small rank now loses much more. Set LoRA rank to 16 in the second panel. It trains about 42 million weights, or 0.6% of the layer weights. Memory for weights and optimizer falls from about 112 GB to 15 GB; this count leaves out embeddings and temporary training data.

After training, the change can be added to the base weights. That avoids extra work at inference. Or keep it separate, so many task-specific changes share one base.

Storing the frozen base in four bits while training these small changes is **QLoRA**. Its published recipe fit a 65-billion-weight fine-tune on one 48 GB GPU. Compared with full fine-tuning, LoRA can learn less from large new datasets, but also forget less.

## Combine skills or teach a smaller model

Subtract the base from a fine-tuned model to get a **task vector**. Adding several such changes can combine skills without more training. Use models with the same base and test the result; a merge can lose skills too.

A small model can learn to imitate a large one. This is **distillation**. It can copy generated answers or match the teacher's next-token chances. Google trained smaller Gemma 2 models with those chances. DeepSeek's January 2025 R1 release included small models trained on 800,000 generated examples. Qwen and DeepSeek also used distillation in their 2026 models.

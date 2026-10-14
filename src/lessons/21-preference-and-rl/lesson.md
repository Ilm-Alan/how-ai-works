Examples teach a model to copy good answers. Scores let it learn from answers it tries itself. The model's chances of choosing each answer form its **policy**. A score for an answer is its **reward**.

## A score is not the goal

People can compare two answers and pick the better one. A **reward model** learns to predict those choices. Training then makes high-scoring answers more likely.

But a scorer can mistake length or confidence for quality. A model may learn to please that scorer rather than help the user. This is **reward hacking**.

One way to limit change is to keep a copy of the starting model. This is the **reference policy**. A measure called **KL divergence** tracks how far the answer chances move from that reference. A penalty on that distance acts like a leash. It limits change; it does not check truth.

{{lab}}

Set change penalty to 0 and choose full update. Press Start. After 100 steps, true quality is about 0.58. After 3,000, it falls to about 0.05 while reward score reaches 1.30. The model has learned to favor verbose nonsense. Set change penalty to 5 and restart: distance from start stays near 0.005. Choose sampled group to see how learning from a few sampled answers adds noise.

## Learn from pairs or checks

Training directly on a preferred answer and a rejected answer is **direct preference optimization**, or **DPO**. It raises the preferred answer's chance relative to the rejected one, compared with a reference. It needs no separate reward model, but bad comparisons still teach bad habits. Meta's published Llama 4 recipe combines example training, online reinforcement learning, and DPO.

Rewards can also come from a math answer or code tests. This is **reinforcement learning with verifiable rewards**. A test gives a clearer score than taste, but incomplete tests can still reward wrong code.

## Compare a group

Try several answers to the same question. Score each against the group's average. This gives its **advantage**: how much better or worse it did. **Group relative policy optimization**, or **GRPO**, uses such comparisons to guide updates. If all answers score the same, there is no signal about which to favor.

Newer methods such as DAPO and GSPO change how updates are limited. They do not make the reward a perfect judge. Always check results on tasks that did not supply the training reward.

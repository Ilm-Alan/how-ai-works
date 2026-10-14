Training means finding weights that give a low error score, or loss. Trying every set of weights would take too long. Instead, a model checks which way lowers the loss, takes a small step, and repeats.

## Walk downhill

The list of slopes for all weights is the **gradient**. Each slope says how fast the loss changes when you nudge one weight. The gradient points uphill. Moving the other way is **gradient descent**:

$$w \leftarrow w-\eta\nabla L(w).$$

In words: subtract the gradient, scaled by the step size, from the weights. That step size is the **learning rate**. Too small, and training crawls. Too large, and it jumps past the low point and may run away.

A narrow valley makes this hard. A step that works along its gentle floor may be too large across its steep walls. One rate must serve both directions.

{{lab}}

Keep the default surface and starting point. Set learning rate to 0.01, steps to 60, and gradient noise to 0. Plain gradient descent ends near loss 0.936; momentum ends near 0.030. Now raise learning rate to about 0.11. Plain descent runs away because this valley needs a rate below 0.1.

## Remember past steps

Keeping a running sum of past gradients is called **momentum**. Steps along the valley add up. Steps that swing back and forth across it tend to cancel. This helps the model move faster in useful directions.

Another method, **Adam**, tracks both the gradient and its squared size. It uses these to scale each weight's step. Steep and gentle directions can then move at more similar speeds. Adam still needs a well-chosen learning rate; lower it near the end to help settle.

**AdamW** adds a separate penalty that shrinks weights. It stores two extra numbers per weight, so training needs more memory than running a trained model. New methods also matter: Kimi K2, a trillion-parameter model released in 2025, used a version of **Muon**, which reshapes updates to weight matrices.

## Learn from a small batch

Computing a gradient on all the data for every step would be costly. Training uses a small group of examples, a **minibatch**, instead. This gives a noisy estimate of the full gradient.

Turn up gradient noise to see the paths wobble. Larger batches reduce this noise but cost more work per step. Smaller learning rates reduce the wobble too, but need more steps.

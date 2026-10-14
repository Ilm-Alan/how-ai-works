Most image generators start with noise, then turn it into an image in small steps. They work on the whole image at once, rather than drawing one pixel after another.

## Learn to undo noise

During training, mix a real image with noise. Ask a network which way that mix is moving as more noise is added. This direction is called **velocity**. To make an image, start with fresh noise and follow the predicted direction backward.

The lab uses a straight path between data and noise, called **rectified flow**:

$$x_t = (1-t)x_0 + t\varepsilon.$$

Here, $x_0$ is the clean image and $\varepsilon$ is noise. At $t=0$ you have data; at $t=1$ you have only noise. Earlier **diffusion** models use a different mixing rule, but share the idea of learning to undo noise.

{{lab}}

Set data to three blobs and sampling steps to 1. All 600 points land at the same place: the mean of the data. Noise alone gives no clue which clean point to choose. More steps let points split into clusters instead of collapsing to an average. The lab knows the data, so it can compute the direction exactly; a real model must learn it.

## Follow a prompt

Text-to-image models learn from images paired with captions. They compare a prediction with the caption against one without it. Pushing farther toward the caption's prediction is called **classifier-free guidance**.

Set sampling steps to 30 and generate to class A (orange). Raise guidance scale from 1 to 8. Spread within clusters drops from about 0.157 to 0.100, and the points move away from the other clusters. In images, stronger guidance can improve prompt matching but reduce variety and exaggerate colors.

## Make it fast

An image can first be compressed into a smaller set of values, called a **latent**. Stable Diffusion turns a 512×512 color image into a 64×64×4 latent. Each step then costs much less. FLUX.1 [schnell] learns a shortcut and needs just 1–4 steps.

Video adds time to this process. As of October 2026, Google's Veo 3.1 also makes audio. OpenAI shut down its Sora 2 video API on September 24, 2026. Not all image tools use only diffusion: GLM-Image first predicts a layout, then uses diffusion to render it.

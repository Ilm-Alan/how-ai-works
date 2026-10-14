A model that takes more than one kind of input is **multimodal**. It turns images, sound, or video into lists of numbers it can combine with text. An image token stands for pixels, not a word about those pixels.

## Turn pixels into tokens

A model can cut an image into square patches and map each patch to a vector. This is a **vision transformer**. Position tags tell it where patches belong. Attention lets it connect a chart's key to its lines.

Smaller patches keep more detail but cost more work. At 512×384 pixels, 32-pixel patches give 192 tokens. Full attention compares each token with every token: 36,864 scores per head. Halving the patch side makes four times as many tokens and 16 times as many scores.

A learned map can turn image vectors into the language model's input vectors. This is a **projector**. Other models train a shared network to mix image and text input early.

## Learn which caption matches

A model can learn from paired images and captions. CLIP trains it to score the right pairs above other pairs. This is **contrastive learning**. It learns to match, not to write captions one word at a time.

The training penalty is called the **loss**. Lower temperature gives the strongest matches more weight. It lowers loss for good matches, but makes wrong matches more costly.

{{lab}}

Leave image width (px) at 512 and image height (px) at 384. Change patch side (px) from 32 to 16: tokens rise from 192 to 768; scores rise from 36,864 to 589,824. Leave vector noise at 0.10, turn on swap captions 1 and 2, and lower temperature from 0.20 to 0.10. Loss rises from 3.85 to 7.64. The matching panel uses separate vectors, not the drawn image.

## Detail, sound, and time

Billed tokens are not always patch counts. OpenAI's October 2026 GPT-4.1 high-detail rule charges 85 base tokens plus 170 per tile. Select its billing preset and set both image sides to 1024. It shrinks the image to 768×768; four tiles cost 765 tokens.

A transcript loses tone and background sounds. Direct audio input can keep them. Video adds time, but a brief event between sampled frames may be missing.

Gemini 4 Argon accepts text, images, video, audio, and PDFs as of October 2026. Qwen3.8-27B and Kimi K3 also support vision; Llama 4 Scout and Maverick launched with text and vision in April 2025. Support for an input type does not promise accurate perception.

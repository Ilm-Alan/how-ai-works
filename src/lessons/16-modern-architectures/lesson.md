Two models with the same number of weights can have very different costs. One may use only some weights for each token. Another may store much less of the past. Modern designs try to save both work and memory.

## Store many weights, use a few

A model can choose among several small networks for each token. This is a **mixture of experts**. A learned **router** picks which experts to use and mixes their outputs. The experts learn their own roles; they are not assigned names like “math.”

With 64 experts of 0.1 billion weights each, plus 1 billion shared weights, the model stores 7.4 billion weights. Choosing four experts uses just 1.4 billion per token. All the weights still need storage. Moving work between devices and keeping experts busy also cost time.

## Store less of the past

Attention saves old keys and values so it need not build them again. This saved state is the **key/value cache**. It grows as the text grows.

With **multi-head attention**, each query head has its own keys and values. Letting several query heads share them is **grouped-query attention**. Forty query heads sharing eight sets use one fifth of the usual cache. The queries still do their work.

Another design stores a compressed summary of keys and values together. This is **multi-head latent attention**. DeepSeek also stores a small key for position. The joint summary is stored once, not once for keys and again for values.

{{lab}}

Keep context tokens at 32,768. The Qwen2.5-32B preset uses 8 GiB of cache. Change attention to separate keys and values: it rises to 40 GiB. Choose the DeepSeek-V3 preset instead: the cache is about 2.145 GiB. These counts cover the cache, not model weights.

A **sliding window** keeps only recent tokens in local layers. Their storage stops growing once the window is full. Global layers still keep the whole past.

## No single design has won

Some layers keep a fixed-size summary instead of a growing cache. Hybrid models mix these layers with attention. In 2026, Qwen3-Coder-Next reports 80 billion total weights but only 3 billion active. It mixes summary-based layers and attention. gpt-oss mixes full and local attention. MiniMax M2 instead uses full attention with shared keys and values: replacing attention is not inevitable.

Diffusion models revise masked words rather than only adding the next word. The September 2026 dQwen3.5 paper adapts existing hybrid models this way. It does not show that diffusion has replaced leading next-token models.

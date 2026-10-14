A transformer turns each token into a vector, then updates those vectors through a stack of blocks. Each block gathers clues from earlier tokens and works on those clues. At the end, the model gives each possible next token a score.

## A block adds to what it knows

The running vector at each position is the **residual stream**. A block adds two updates to it rather than replacing it. This gives information a direct path through many blocks.

First, attention gathers information from allowed positions. Next, a small network works on each position on its own. This network is called an **MLP**, short for multilayer perceptron. Both updates must have the same width as the stream they join.

Before each update, the block rescales its input. **RMSNorm** does this using the square root of the mean squared values. It does not subtract the mean, unlike LayerNorm.

One common MLP lets one branch control how much of another branch gets through. This is **SwiGLU**. It has three weight matrices: two going in and one going out. A classic MLP has two.

## Give attention a sense of position

Token content alone does not say how far apart two words are. One way to add position is to rotate pairs of values in the queries and keys. This is called **rotary position embeddings**, or **RoPE**.

Different pairs rotate at different speeds. Their dot product depends on the gap between positions. Shift both positions by the same amount, and that score stays the same for fixed content vectors. The rotations do not impose a hard distance limit or ensure good results on longer text.

{{lab}}

Keep the defaults and set common position shift to 20. The arrows turn, but the dot product stays at 2.368344. Then turn on tie embedding and output weights. Total weights falls from 8.030261 billion to 7.504925 billion.

## Count the actual weights

The calculator starts with the published Llama 3 8B layout. It has 32 blocks and vectors of width 4,096. Its exact count is 8,030,261,248 weights; “8B” is rounded.

Sharing keys and values makes their matrices smaller, not the query or output matrices. Tying the input and output tables saves one vocabulary-sized table. It still leaves one output score per token in the vocabulary. Count these matrices rather than trusting a single formula for every transformer.

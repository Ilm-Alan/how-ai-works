A neural network builds a rule from small functions arranged in layers. Training changes their weights so that each layer helps the next one make a better guess. The middle layers learn useful features rather than relying only on features you chose by hand.

## Build one small function

One such function is a **neuron**. It multiplies each input by a weight, adds the results, and adds an offset called a **bias**. Then it applies a function that bends the result, an **activation function**:

$$h=\phi(w_1x_1+w_2x_2+b).$$

The weights choose which inputs matter. The bias shifts where the response changes. The activation controls the shape of that response. This is a small math function, not a simulation of a brain cell.

A layer runs many neurons at once. The number of neurons is its **width**. The number of layers is its **depth**. A layer with 5 inputs and 8 neurons has 40 weights and 8 biases: 48 numbers to learn.

## Why the bend matters

Stacking weighted sums without a bend still gives one weighted sum. More layers cannot fix that limit. With two input numbers, such a network can only split two classes with a straight line.

Imagine a square whose opposite corners share a label. No straight line can separate them from the other pair. This pattern is called **XOR**, or exclusive OR. A hidden activation lets the network split space into regions and combine those regions.

{{lab}}

Keep dataset at xor, hidden width at 12, hidden layers at 2, and activation at tanh. Press Start. After 800 steps, training accuracy reaches 100%. Set activation to linear and press Start again. Accuracy ends near 32%, and the split remains a straight line.

The score measures these training dots, not new examples. A dark region shows a confident guess, not proof that the guess is right.

## Pick a shape

The **ReLU** function keeps positive values and turns negative ones into zero. It makes shapes from straight pieces. The lab's **tanh** function makes smooth bends and keeps outputs between −1 and 1. At large input values it flattens out, so gradients can become small.

A wide enough network can approximate many useful functions. That does not mean training will find the right weights. Nor does it promise good guesses on new data. The shape, the training method, and the examples all matter.

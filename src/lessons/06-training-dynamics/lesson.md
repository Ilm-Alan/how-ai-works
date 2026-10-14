A deep network may be able to express a good rule yet fail to learn it. The signal that tells early layers how to change can fade on its way back. Good starting weights and shorter routes help that signal reach every layer.

## Keep the signal alive

Backpropagation multiplies slopes through layers. Multiply by 0.5 twenty times and you get about one millionth. Early layers then receive almost no signal. These are **vanishing gradients**. Repeated large factors can instead make the signal grow too much: **exploding gradients**.

A tiny gradient does not mean a layer has learned the right features. It may mean the loss barely responds to that layer under the current settings.

Starting weights matter. Scale them to the number of inputs rather than using the same size for every layer. Bigger weights are not always better: tanh can flatten at large values, making its slope tiny.

## Add a shorter route

Adding a layer's input to its learned change gives a **residual connection**:

$$\text{next value}=\text{input}+\text{learned change}.$$

The direct route lets information and gradients bypass the learned branch. It helps, but does not guarantee stable training.

Keeping the size of each layer's values under control is **normalization**. The lab uses **RMSNorm**, which divides values by their root mean square. That is a measure of their typical size. It acts before the learned branch and leaves the direct route alone.

{{lab}}

Keep residual connections and normalization on, with initial weight scale at 0.7. Press Start. Loss falls from about 0.48 to 0.0037 after 300 updates. Turn both switches off. Before training, layer 1 gradient is about 0.00001, while layer 20 gradient is about 0.125. Press Start again: loss ends near 0.19. The bars show gradient size at each layer, not weight updates.

## Stable training is not enough

A model can train smoothly and still fit noise. Check new data as well as training loss.

Charging for large weights is **weight decay**. Randomly hiding some layer values during training is **dropout**. Choosing an earlier saved model based on validation scores is **early stopping**. Each can help reduce overfitting.

You can also make more training examples by changing existing ones without changing their labels. This is **data augmentation**. Shifting an image may preserve its label; turning a handwritten 6 upside down may not.

A flat training loss and a rising validation loss point to different problems. Check signal flow for the first and overfitting for the second. Sometimes test scores improve long after training examples are fit, a pattern called **grokking**. It does not mean overfitting always fixes itself.

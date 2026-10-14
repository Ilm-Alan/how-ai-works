Training needs to know how each weight affects the loss. Changing each weight and rerunning the whole model would be slow. Instead, we reuse the steps that made the prediction and work backward. This is **backpropagation**.

## Record the steps

A map of inputs and the operations that use them is a **computational graph**. Each arrow means one value depends on another.

In this lab, a neuron multiplies two inputs by their weights. It adds those products and a bias, then applies tanh. Finally, it compares the output with the target and squares the error.

Computing these values in order is the **forward pass**. You must find the sum before applying tanh, and find the prediction before scoring its error. Keep those values: the backward work will need them.

## Follow the effect backward

A slope tells us how much one value changes when another changes. To find the effect through several steps, multiply their slopes. This is the **chain rule**.

For example, doubling one input doubles its effect on a weighted sum. But if tanh is nearly flat at that sum, little of the change reaches the prediction. A wrong answer can therefore have a small weight gradient.

The **backward pass** starts at the loss with a slope of 1. Each operation multiplies the arriving slope by its own local slope. It sends that result to its inputs. If two paths use the same value, add their contributions before going further backward.

{{lab}}

Keep the default inputs. Press Step forward until the loss is filled in, then Step backward until all gradients are checked. The loss is about 0.12314, and the w1 gradient is about 0.17898. The Small-change check column confirms the slopes by nudging each value and recomputing the loss.

## One pass, many weights

One backward pass finds slopes for all the weights. It still costs more as the network grows, but it shares work instead of rerunning the model for each weight.

For common dense layers, backward work costs roughly twice the forward work. Forward plus backward thus often costs about three forward passes, not two. The exact cost depends on which slopes you need.

Libraries can record the graph and apply these rules for you. They still need to store values from the forward pass, which uses memory. Saving only some values and recomputing the rest is called **activation checkpointing**. It trades more computation for less memory without changing the derivative rules.

A language model gives each possible next token a chance. It picks one, adds it to the text, and does the same thing again. Building text one step at a time is **autoregressive generation**.

This rule can make a new passage without storing that whole passage. But a likely next word is not a checked fact. Fluent text can still be false.

## Start with counts

A model that counts short runs of text is an **n-gram model**. The lab uses characters. At order 3 it looks at the two previous characters. If `th` was followed by `e` 80 times and `a` 20 times, their chances would be 80% and 20% before adding extra counts.

Longer context can copy longer patterns, but many patterns never appear in a short book excerpt. The lab falls back to a shorter ending when it has no exact match. It also adds 0.1 to each character's count so every known character keeps a chance.

{{lab}}

Raise order from 3 to 6. Training loss falls from 1.629 to 1.575, but test loss rises from 2.212 to 2.549. The model fits the training text better and new text worse. Set temperature to 0 for the most likely next character each time. The loss scores stay the same.

## Measure surprise

A model pays a larger cost when it gives the real next character a low chance. The mean cost is **cross-entropy**, or loss. Lower is better. The lab measures it in **nats**, units based on the natural logarithm.

A 50% chance costs about 0.693 nats. A 1% chance costs about 4.605. Confident wrong guesses cost much more.

The lab learns from the first 80% of the text and tests on the last 20%. During this test, it sees the real previous characters, not its own guesses.

Turning loss into a rough choice count gives **perplexity**. Lower is better here too. Compare it only when models use the same text units and test rules.

## Choose the next character

Always picking the top choice is **greedy decoding**. It can repeat itself. Temperature below 1 favors stronger choices; above 1 spreads the chances out.

**Top-k** keeps the k strongest choices. **Top-p** keeps enough top choices to reach a chosen total chance. At 0.8, chances of 0.6 and 0.25 both stay.

**Min-p** keeps choices above a fraction of the best chance. If the best is 0.4 and min-p is 0.1, the cutoff is 0.04. These filters change what gets picked, not what the model learned. They cannot add a missing fact.

This lab trains a small transformer on text in your browser. It starts with random weights. Every loss value and each new character come from those weights, not from a model trained elsewhere.

## Guess the next character

Each distinct character gets a number. The model learns to guess the next one from a short stretch of text. For `thou`, the inputs `tho` have targets `hou`. A mask hides later characters so the model cannot read the answers.

The model turns characters into vectors and adds a vector for each position. Its blocks use attention to gather clues, then a small network to process them. Each block adds its results to the running vectors. The output gives each possible next character a score.

At Width 32, the sonnet model has 13,344 weights. Each training step uses four random text windows. The last 10% of the text stays out of training. This unseen part lets us check whether the model learns useful patterns.

## Watch the guesses improve

The score for wrong or uncertain guesses is **loss**. Lower is better. A model that gives all 63 characters equal chances has loss about 4.14. The dashed line shows this starting point.

Loss 2.0 means the model is about as unsure as a choice among 7.4 equally likely characters. That number of choices is called **perplexity**.

{{lab}}

Choose the sonnets in Training text, keep Width at 32, and press Start. Watch training loss and unseen text loss move below the equal-chance loss of 4.14. New samples appear every 100 steps. Compare Sample temperature 0 with 0.8. At 0, the model always picks its top choice and can get stuck in loops. At 0.8, it can pick other characters too.

## Learning or memorizing?

Switch Training text to the Alice excerpt. Watch both loss curves, not just the samples. If training loss keeps falling while unseen text loss stops improving, the model is memorizing its text. This is **overfitting**.

More text, a smaller model, or stopping sooner can help. A nice-looking sample alone does not show that the model learned well.

The attention map shows where one head looks in your prompt. Bright cells mean larger attention weights. They are clues about the model's work, not proof of why it chose a character.

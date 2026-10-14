Machine learning finds a rule by trying it on examples. The rule is a **model**. Its adjustable numbers are **parameters**. A score for how wrong its guesses are is the **loss**. Training changes the numbers to lower that score.

A language model learns this way too. It reads text and tries to guess the next word. The text itself supplies the right answer.

## Test on new examples

A curve can fit the points you show it but fail on new points. Doing well on new data is called **generalization**. That is the goal, not a perfect training score.

Split your data into three groups. Fit the model on the **training set**. Use the **validation set** to choose settings. Use the **test set** once, at the end, to report how well it works. Choosing settings based on test scores makes that final score too rosy.

The same problem affects language models. If test questions appeared in their training text, the test may reward recall. This is called **contamination**.

{{lab}}

Keep training points at 12 and noise at 0.25. Set degree to 3, then 9. With the default points, test error rises from about 0.064 to 638. The curve gets better at fitting these points but worse at predicting new ones. Leave ridge strength at 0 for this comparison.

## Fit the pattern, not the noise

A rule that is too simple misses the pattern: **underfitting**. A rule that follows random bumps in the data is **overfitting**. More data or a simpler rule can help.

You can also charge the model for large weights. This penalty is **regularization**; the lab uses a version called **ridge regression**. It keeps a flexible curve from swinging too far.

Test error does not always rise as models grow. It can fall again in very large models, a pattern called **double descent**. Keep judging on new data rather than model size alone.

## Where answers come from

Where do the right answers come from? In **supervised learning**, people label examples: this email is spam, this one isn't. In **self-supervised learning**, the data labels itself, like the next word in a sentence. In **reinforcement learning**, the model gets a score for how a whole attempt went. Language models use all three.

Different models suit different data. Decision trees still win on spreadsheet-style tables, though TabPFN (2025), a model pretrained on tables, matches them on tables up to about 10,000 rows. Neural networks win on text, images, and sound, where they learn their own features.

A test score tells you how well a model did on one set of data. It does not tell you whether the test was fair, large enough, or useful for your task.

## Compare with doing nothing

Start with a simple rule, called a **baseline**. If only 1% of payments are fraud, marking none as fraud is 99% accurate. A model with 98.5% accuracy loses to that rule.

Many models give each item a score. A cutoff, called a **threshold**, turns that score into a yes or no. Lower it to catch more fraud, but expect more false alarms.

Of all the items you flag, the share that really are fraud is **precision**. Of all the real fraud, the share you catch is **recall**. A spam filter should avoid flagging real mail. A health screen may care more about catching cases, then checking false alarms.

{{lab}}

Leave the other controls alone, set positive rate to 1%, and press New sample once. Precision is about 3%, while accuracy is 77%. The always-negative baseline is 99%. False alarms swamp the few real cases. A high recall alone does not mean most flagged items are right.

A curve that plots recall against the false alarm rate is a **ROC curve**. Its area, **AUC**, measures how well scores rank cases above non-cases. It does not tell you how many false alarms to expect.

## Small gaps need more data

Test scores vary with the items you draw. Set test set size to 100 and press New sample a few times. Watch accuracy move. Around a 77% score, the range of plausible scores is about eight points on either side.

To halve that range, use four times as much data. A one-point lead on a few hundred questions is weak evidence. Compare models on the same questions and inspect where they differ.

A claimed chance should also match results. If cases given an 80% chance succeed about 80% of the time, the scores are **calibrated**. Good rankings do not guarantee this.

## Keep the test separate

When test data helps train or choose a model, the score looks too good. This is **leakage**. Near-copies in both sets can cause it. So can training on future days to predict past days.

Split data first, by person or time when needed. Keep the final test out of training and tuning. Use it only when you are ready to judge the model.

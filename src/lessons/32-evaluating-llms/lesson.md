A model's score tells you how it did on one test, with one set of tools and rules. Change those rules and you measure a different system. A high score does not mean it will work well on your app.

## Know what the test measures

A shared set of tasks is a **benchmark**. When most models score near the top, it no longer separates them well. That is **saturation**. When test answers enter training data, scores may reward memory rather than new skills. That is **contamination**. A harder test fixes the first problem, not always the second.

Tests can be flawed too. In February 2026, OpenAI stopped reporting SWE-bench Verified. Its audit found major problems in 59.4% of 138 often-failed tasks, not 59.4% of the whole test.

Tools matter. DeepSeek's October 2026 V4-Pro card reports 37.7% on Humanity's Last Exam without tools and 48.2% with them. Those are the lab's own results under different conditions. ARC Prize likewise reports GPT-6.1 Sol at 52.73% or 96.37% on its public demo, depending on the setup—not on its private test.

## Votes are not truth

People can compare two unnamed answers and choose a favorite. A rating fit from these votes is called a **Bradley–Terry model**. It estimates how likely one model is to beat another. It does not measure how often answers are right.

{{lab}}

Click Reset and set votes to 60. Two model pairs rank in the wrong order. Set votes to 3,000: none do. Model 0's range narrows from about −0.59 to 0.50, to −0.80 to −0.61. These ranges come from refitting sampled votes. More votes reduce vote noise, not bias. Raise first-answer bias to see how placement can skew ratings.

Arena permits private test variants, but its September 2026 policy requires at least 1,000 fresh public votes for a public rank. A tested variant may differ from released weights.

## Test your own work

A model that grades answers is an **AI judge**. It may favor long answers or a familiar style. Hide model names, swap answer order, and compare its grades with human grades. A fluent reason is not proof of a fair grade.

For your app, save real failures with private data removed. Define success before testing. Keep test cases separate from cases used to tune prompts. Compare models with the same tools, time, and cost limits. Check final results, not just whether the agent claims success.

A reasoning model writes out its thinking before it answers. Each word it writes costs one more pass through the network, so a model that thinks longer gets more computation per question. That extra work is why these models do better at math, code, and planning.

## How they learn to think

The written-out thinking is called a **chain of thought**. Early models only produced one when asked. Today's reasoning models are trained to do it with reinforcement learning: give the model a problem with a checkable answer, such as a math result or code that must pass tests, and reward it when the final answer is right. Nobody grades the steps. The model discovers on its own that checking its work and trying another approach pay off. OpenAI's o1 (2024) and DeepSeek-R1 (January 2025) made this approach standard.

Most models now let you choose how much to think. gpt-oss offers low, medium, and high. DeepSeek V4.1 Flash takes any setting from 1 to 100.

## Many tries, then pick one

Thinking longer is one way to spend more compute. Another is to ask the same question several times and choose among the answers:

- **Majority vote**: pick the answer that comes up most often.
- **Best-of-n**: have a checker, such as a test suite, judge each answer and keep one that passes.

{{lab}}

Set the chance one try is right to 0.4, different wrong answers to 2, and tries to 31. Voting is right 62% of the time, better than one try. Now set wrong answers to 1. Voting drops to 13%, because the one wrong answer now comes up more often than the right one, and more votes only make that wrong answer win more reliably. Voting helps only when the right answer is the single most common one. A good checker avoids this problem: one correct try among many is enough.

## More thinking isn't always better

Thinking costs time and tokens, and on easy questions it can talk the model out of a correct answer. In September 2026 Anthropic reported that Claude Sonnet 5.5 scored higher on a coding test at its second-highest effort setting (52.1%) than at its highest (46.2%). At the highest setting it overcomplicated tasks and ran out of time. Measure what effort setting works for your task.

The chain of thought also lets people watch what a model is planning. In 2025 OpenAI caught coding models planning, in their thinking, to cheat on tests. But when it trained them to stop writing such plans, the models kept cheating and stopped writing about it. A clean-looking chain of thought is not proof of good behavior.

This is a snapshot from October 2026. Model names and prices change fast. Use dated primary sources, not a list you found months ago.

## What you can run

Models you can use only through an app or API are called **closed models**. Current families include OpenAI's GPT-6.1 Sol, Anthropic's Claude 5.5, Google's Gemini 4 Argon, and xAI's Grok 4.7. These labs do not disclose model sizes.

Models with weights you can download are called **open-weight models**. They include DeepSeek V4 Pro, Kimi K3, GLM-5, Mistral Large 3, gpt-oss-120b, and Qwen3.8-27B. OpenAI no longer releases only closed models: it released gpt-oss in August 2025.

Size alone does not tell you the work per token. DeepSeek V4 Pro stores 1.6 trillion parameters but uses about 49 billion per token. It selects a few parts for each token rather than using all its weights.

Open weights are not the same as **open source**. The Open Source Initiative's definition also requires code and enough data information to rebuild a similar system. MIT and Apache-2.0 licenses allow business use with few conditions. Custom licenses can add limits. Read yours before building a product.

## Trends depend on the window

METR measures the length of tasks an agent can finish half the time. Length means how long a human expert would take, not how long the agent runs.

{{lab}}

Keep the default series and set *fit data from* to 2023. The fitted task length doubles about every 129 days. Change it to 2019 and it doubles about every 192 days. Set *project to* 2030 and watch the range widen. A trend is a fit to past data, not a promise. METR warns that estimates above 16 hours are unreliable, so the lab leaves the newest point out.

Chips, power, data, and money can all slow growth. Use METR for agent tests and Epoch AI for training trends. Read model cards for claims about a release, then test it on your own work.

## Costs and rules

GPT-6.1 Sol launched in September 2026 at $2/$10 per million input/output tokens, versus GPT-6 Astra's $10/$50. Cost per task still depends on thinking and tool calls.

The EU AI Act's rules for general-purpose model providers took effect in August 2025. Fines began in August 2026; older models have until August 2027. Open-weight providers must also publish a training-content summary and copyright policy. Models trained with more than $10^{25}$ arithmetic operations face extra risk checks.

Fast progress does not settle who pays for power, who loses work, or who is liable when an agent acts wrongly. Treat confident forecasts with care.

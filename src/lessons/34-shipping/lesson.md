A good demo is not a shipped feature. You need to know how often it works, what it costs, how long it takes, and what happens when it fails.

## Set a quality bar

Collect 50–200 real inputs before you pick a model. Write down what a good output means for each. This set of checks is an **eval set**. Use code to check exact answers, data formats, or tests. For judgment calls, compare an AI judge with human grades first.

Start with a strong model to see if the task works at all. Then try cheaper models and less thinking. Pick the cheapest setup that still meets your bar. A public ranking cannot tell you which one passes your task.

Run these checks before each change to prompts, models, or search. Save new failures as test cases. Pin a model version rather than trusting a changing “latest” name. OpenAI's Sora 2 video API closed on September 24, 2026, without a direct replacement: watch shutdown notices too.

## Pay for the whole task

Users notice the wait before output starts and how fast it arrives. Stream text when someone is watching. More thinking can improve answers but add a long wait. Choose the thinking level for each kind of request.

Cost adds up across every call. An agent that calls a model forty times can be costly even if each call is cheap. Reuse saved prompt prefixes, trim unused context, and use batch work when it can wait. OpenAI and Anthropic offer 50% off batches finished within 24 hours.

{{lab}}

At the defaults, 50,000 requests per day cost $20 through the API and about $84 on a rented GPU. Set busy time to 80%: self-hosting breaks even near 210,000 requests per day. Set input price to 2 and output price to 10: it wins above about 10,000 requests. Prices are dollars per million tokens.

A graphics processor, or **GPU**, costs money even when idle. Hosting it yourself also means handling upgrades and outages. It can give you more control over data and speed. Compare quality first: cheaper hosting is no help if that model fails your checks.

## Plan for failure

Check output against a schema and other rules you can test. Set time limits and prepare a fallback that also passes your eval set. Require human approval for actions that cannot be undone.

Log results, tool calls, time, and cost within your privacy rules. Review failures each week. Users and documents change, so keep adding new cases rather than trusting yesterday's score.

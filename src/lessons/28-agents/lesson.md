A model that calls tools in a loop is an **agent**. It picks an action, your code runs it, and the result goes back into its context. It uses that result to pick the next action or say it is done.

The hard part is not the loop. It is keeping the work on track across many steps.

## Small errors add up

If each step has an independent chance $p$ of success, all $n$ steps succeed with chance $p^n$. Each extra step is another chance to fail. At 95% per step, ten steps succeed about 60% of the time. Fifty steps succeed only 8% of the time.

Checks can catch errors and give the agent another try. This is **verification**. Tests and compilers make code a useful setting for agents: they give fast feedback on whether a change works.

{{lab}}

Set chance one step works to 0.95 and steps to 50. With chance a check catches an error at 0, success is 8%. Raise it to 0.8 and leave retries per step at 2. Success rises to 59%. Most failures left are wrong without noticing. The agent needs checks that test the result, not just whether a tool ran.

Real errors are not independent. Still, this model shows why short, checked tasks beat long, unchecked ones.

## Keep useful memory and clear limits

Tool results fill the context window. Agents can sum up old turns, keep notes in files, or give a separate task to another agent. Reusable instructions and scripts, called **skills**, load only when needed. Agent Skills became an open standard in December 2025. By then, over 60,000 projects used AGENTS.md instruction files.

Set turn and cost limits. Ask for human approval before actions that cannot be undone. Keep a log of tool calls, and treat their results as untrusted data.

## Read success claims carefully

A task's length in human work time is its **time horizon**. METR's September 2026 results gave Claude Opus 4.6 a 50% horizon near 12 hours, but an 80% horizon near 70 minutes. Tasks you need done reliably must be much shorter than the headline figure.

In September 2026, Claude Sonnet 5.5 reported 70.6% on Terminal-Bench 4.0 and 80.1% on OSWorld 2.1. The latter gives partial credit. It does not mean the model finished 80% of desktop tasks. Always read what a score counts.

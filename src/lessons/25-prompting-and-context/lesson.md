A prompt guides a model without changing its weights. The request's instructions, examples, documents, and chat history form its **context**. Learning a rule from examples in that input is **in-context learning**. Show both a match and a counterexample when the boundary matters.

## State the job

“Analyze this ticket” leaves too much open. Try: “Choose billing, outage, or other. Use outage only when the service cannot be reached. Give the label and one supporting sentence.” Now you can check the result.

Keep app instructions separate from user requests and evidence. Roles tell the model which instructions have priority; they are not access controls. A document that says “ignore previous instructions” is still evidence, not a new app rule.

Use headings and document names to show what each piece is for. When an answer needs sources, ask for document identifiers. Then check that the cited text exists and supports the claim.

## Keep what matters

A large context window means the input fits, not that the model uses every detail well. Chroma's July 2025 Context Rot study found uneven results and worse performance with longer input across 18 models. Test your actual tasks at the lengths you expect.

Choosing what earns space in the input is **context engineering**. Keep the task, rules, relevant evidence, and open decisions. Drop old drafts and repeated logs. Preserve exact errors and identifiers when a changed character would matter.

A shorter summary can lose an exception or turn a guess into a fact. Mark facts and guesses separately. Keep links to the raw evidence for decisions that still need it.

## Reuse the start

**Prompt caching** reuses processed input, not an old answer. Claude orders the prefix as tools, system instructions, then messages. A **breakpoint** marks the end of the part to reuse. Changes before it break the match; changes after it do not.

{{lab}}

Set content changed between turns to documents. The default breakpoint after documents makes eight cache writes and costs $0.25840. Change breakpoint after to system: the 2,000-token prefix gets seven hits and costs $0.20080. Set request gap (seconds) to 310 to exceed the five-minute lifetime and force writes again.

The October 2026 Claude Sonnet 5.5 defaults cost $2 per million input tokens, $2.50 for five-minute writes, $0.10 for reads, and $10 for output. One-hour writes cost $4; at least 512 prefix tokens are needed. Writes replace the normal input charge, so a changing prefix can cost more with caching. Caching saves input work, not output generation.

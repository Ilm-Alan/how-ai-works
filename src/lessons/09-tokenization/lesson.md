A language model reads numbered text pieces, not whole words. A tool that turns text into these pieces and back is a **tokenizer**. Each piece is a **token**. It can be a word, part of one, a space, or a mark like a comma.

Whole words make a poor fixed list. New names and code appear all the time. Single letters work, but make long lists of tokens. Keeping common pieces together gives a useful middle ground.

## Learn which pieces to join

Start with small pieces and join the most common pair. Repeat with the new pieces. This rule is **byte-pair encoding**, or **BPE**.

A byte is one of 256 possible values. Text stored as UTF-8 uses one to four bytes per character. Start with all 256 bytes, and even a new emoji can be read. It may just need more tokens.

In `banana banana`, the pair `an` appears four times within words. Join it, and each word becomes `b`, `an`, `an`, `a`. Then count pairs again: the neighbors have changed.

Training saves the order of the joins. New text uses that saved list; it does not train a new one. To get text back, join all the tokens' bytes, then read them as text. One token may hold only part of a character.

{{lab}}

Press Start with the default text. Set merges applied to 0, then 100. The text to encode goes from 46 tokens to 34. At 30 merges it uses 39. Text comes back unchanged at each setting. The lab keeps joins within chunks of letters, digits, spaces, or marks.

## Pieces affect cost and tasks

Counting letters is not the same as counting tokens. To count the letter `r`, the model must work back from pieces to letters. Code can do that directly.

Spaces, capital letters, and digits can change the split. Nearby token IDs do not mean nearby meanings: IDs are just row numbers in a table.

OpenAI's English guide gives about 0.75 words per token. That is a rough guide, not a law. Check your actual text with the chosen tokenizer before estimating cost or how much fits.

As checked in October 2026, OpenAI's `o200k_base` has 199,998 regular tokens and two registered special tokens. Llama 3 has about 128K; Qwen3-8B has 151,669 including added tokens; Gemma 3 has about 262K. Table rows and token counts can differ because of reserved space. Bigger lists can shorten text, but require larger model tables and more output scores.

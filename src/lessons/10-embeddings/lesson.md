A model gives each token a list of learned numbers, called an **embedding**. Think of that list as a point in a space. Points can be close even when their token IDs have nothing in common.

A table stores one list per token. Token 42 reads row 42. With 100,000 tokens and 1,024 numbers per row, the table holds 102.4 million learned numbers. The row number is just an address; the values do the work.

## Learn from nearby words

Words used in similar places tend to have related meanings. This is the **distributional hypothesis**. Both “cat” and “dog” can appear near “pet,” “food,” and “sleep.” They need not appear next to each other.

The lab counts words found near each word in four chapters of *Alice's Adventures in Wonderland*. It skips common words like “the” and looks up to four content words away within a sentence.

Raw counts favor common words. The lab instead scores pairs that appear together more often than chance predicts. This score is **positive pointwise mutual information**, or **PPMI**. Pairs with no positive score get zero.

Next it compresses the count table into a few shared directions. This step is **singular value decomposition**, or **SVD**. Each word gets a shorter list of numbers that keeps the strongest patterns.

{{lab}}

Press Start and leave similarity dimensions at 12. With word set to turtle, mock is the closest match at 0.931. Choose hatter: dormouse is closest at 0.901. Change similarity dimensions to see the rankings shift. The plot only shows two directions, so it cannot show every match.

## Close does not mean the same

To compare two lists, measure how closely they point the same way. This is **cosine similarity**. A score of 1 means the same direction, even if one list is longer. It compares direction rather than size.

“Turtle” matches “mock” because they form a character's name. “Hatter” matches words from the tea party. The vectors learn the book's patterns, not a perfect dictionary. Even opposites like “hot” and “cold” can share nearby words.

Try subtracting one word and adding another. A nearest match always exists, but it may not express the link you wanted.

One fixed list for “bank” blends its river and money senses. This is a **static embedding**. A language model starts with token embeddings, then changes each position's numbers using the text around it. Those later lists can tell the two senses apart. Attention, in the next lessons, makes that mixing possible.

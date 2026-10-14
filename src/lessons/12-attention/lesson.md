A token needs clues from other tokens. In “The cat sat on the mat,” “sat” can use both who acted and where. A way to mix those clues across positions is **attention**.

The mix depends on the current text. The same word can draw on different clues in a different sentence. Training learns which mixes help predict the next token.

## Ask, match, and mix

Each position makes three lists of numbers. A **query** asks for useful clues. A **key** offers something to match against that query. A **value** holds the information to pass along. Separate learned maps create all three from the token's current numbers.

Compare a query with each key using a dot product. A higher score means a stronger match. Divide scores by the square root of their width so wider lists do not make the scores too large.

Turn the scores into nonnegative shares that sum to one. This step is **softmax**. Then mix the values using those shares.

For shares [0.25, 0.75] and values [2, 0] and [0, 4], the mixed result is [0.5, 3]. Each value contributes its share to each output number.

## Block future clues

When predicting the next token, the model must not peek ahead. A rule that blocks future positions is a **causal mask**. It blocks scores before softmax, so allowed shares still sum to one. A position can read itself and earlier positions.

{{lab}}

Set query position to 0 and turn off block future tokens. Later values now enter the mix. Turn it back on: position 0 can read only itself. Set query/key width to 64 and query position to 2. Turn off divide by √d. Mix spread falls from 0.9705 to 0.0057 nats: almost all weight goes to one value. The lab uses fixed random vectors so you can inspect the math.

## Several mixes at once

A model can make several separate mixes, called **attention heads**. It joins their results and maps them back to the model's width. Heads can learn different patterns, but no rule assigns one “grammar” and another “facts.”

Full attention compares every position with every other position. Double the text length and you get four times as many pairs. Fast methods can avoid storing the whole weight table without removing those comparisons.

A bright square shows a large share in one mix. It does not prove that token caused the final answer. Values and later layers matter too. To test importance, change the input and see what happens.

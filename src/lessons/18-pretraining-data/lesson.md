Training text sets what a model gets to practice. A trillion copies of one page give it a trillion tokens to read, not a trillion tokens of new knowledge.

## Turn pages into useful text

A training set can mix web pages, code, books, papers, and generated text. Common Crawl stores pages, not ready-to-use examples. First, extract the main text and remove menus, ads, and cookie notices. Then sort by language and filter broken or highly repetitive pages.

Some filters score how useful a page seems. FineWeb-Edu learns to score educational value from model ratings. That can improve test scores, but “educational” does not mean “true.” A filter may also discard useful chats or niche writing.

Remove private details such as email addresses where possible. Check samples that filters keep and reject. Record where the text came from.

## Find almost the same page

An exact match catches copied pages, but misses a copy with one changed sentence. Compare overlapping word groups instead. These groups are called **shingles**. With groups of three, “the river carries sediment” gives “the river carries” and “river carries sediment.”

The share of distinct groups that two pages have in common is **Jaccard similarity**:

$$J(A,B)=\frac{|A\cap B|}{|A\cup B|}.$$

The top counts shared groups; the bottom counts all groups in either page. A compact random fingerprint, called **MinHash**, estimates this share. More entries make the estimate less noisy.

To avoid checking every pair, split fingerprints into bands. Matching one whole band marks a pair for checking. This is **locality-sensitive hashing**. More bands find more pairs; more rows per band demand closer matches. It is not a hard cutoff, and it compares wording, not meaning.

{{lab}}

Keep words per shingle at 3 and compare documents 1 and 2. Their true shared-group fraction is 0.769; the estimate is 0.680. Set words per shingle to 6: the true fraction falls to 0.538. Then set rows per band to 1. Candidate pairs rises from four to seven.

## Choose the mix, keep the rights

A 10% code share means one tenth of sampled tokens, not files. Repeating small sources changes what the model practices.

In 2026, GLM-5 reports 28.5 trillion training tokens; DeepSeek V4.1 Flash reports 45 trillion, including other media. These are not counts of unique human text. Kimi K2 rewrites documents with checks; fluent generated text alone does not establish facts.

Public access does not grant training rights. Keep source and permission records. European Union rules for general-purpose models require a copyright policy and a public training-content summary, including for open-weight models.

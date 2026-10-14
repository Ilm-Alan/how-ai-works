A model cannot know your private files or every new fact. Your app can search for useful passages and put them in the request. This is **retrieval-augmented generation (RAG)**: find evidence first, then ask the model to use it.

Split files into short passages, store them in a search index, and keep their source names. Search returns candidates, not proof. The model still has to read them and answer the question.

## Search by words or meaning

Exact word search works well for names and error codes. A common method, **BM25**, gives rare matching words more weight. Repeated words help, but each extra repeat helps less. A length correction keeps long files from winning just because they contain more words.

Search can also compare lists of numbers that stand for text. These lists are called **vectors**. Nearby vectors can link different words with a shared meaning. But a passage on the same topic may not contain the answer.

This lab learns word patterns from its own files, using **latent semantic analysis (LSA)**. It does not use a pretrained neural model. Fewer vector dimensions keep fewer patterns and can lose useful details.

You can merge both result lists by rank rather than by raw score. This is **reciprocal rank fusion (RRF)**. It avoids adding scores with different scales. Combining searches does not always improve them.

{{lab}}

Choose the saved query “prevent duplicate invoice when retrying write.” Leave results to show at 5 and vector dimensions at 8. Change search method to Words: recall is 1.00, finding both needed passages. Vectors and Combined each score 0.50. Set vector dimensions to 1: Vectors drops to 0.00.

## Check that the answer is there

The share of needed passages found in the first few results is **recall@k**. Finding one of two gives 0.5. The first useful result's rank gives **reciprocal rank**: first place scores 1, second place 0.5. Its average across queries is **mean reciprocal rank (MRR)**.

Keep rules and their exceptions in the same passage. Check access rights before sending private text to the model. A second model can reorder search results, but cannot find evidence outside that set.

When an answer fails, check search first, then check whether its source supports the claim. In October 2026, Anthropic's guidance also describes search on demand: let the model ask for more evidence when needed. That repeated tool loop is the next step toward agents.

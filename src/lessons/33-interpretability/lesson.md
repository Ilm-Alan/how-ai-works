A model does not keep each idea in its own neuron. One idea may use many neurons, and one neuron may respond to several ideas. Looking inside means finding patterns, then testing what they do.

## Share a small space

A property a model represents, such as a text pattern, is called a **feature**. Think of each feature as an arrow in the model's hidden space. Several arrows can fit in the same small space, but they can interfere with each other.

Packing more features than there are hidden dimensions is called **superposition**. It works best when few features are present at once. Most arrows then stay quiet, so they collide less often. This saves space but can lose information.

{{lab}}

Set features to 5 and importance drop to 0.7. The hidden space always has two dimensions. Set chance a feature is absent to 0, click Start, and train for 6,000 steps. Only two arrows have length above 0.8. Set that chance to 0.95 and train again. All five arrows exceed 0.8, with lengths about 1.03–1.14.

Each arrow stands for one known feature. A short arrow means the model mostly dropped it. A long one means the model kept it. The 0.8 cutoff is just a display rule. The gray bars show how much arrows overlap, not how many mistakes the model makes. Later features matter less when importance drop is below 1.

## Find and test features

Real models do not give us feature labels. A tool that rebuilds hidden values using a few arrows from a larger set is called a **sparse autoencoder**. Researchers inspect the inputs that turn each arrow on to propose what it means. Those names are guesses to test, not facts supplied by the model.

A small classifier trained to read hidden values is a **probe**. If it reads sentiment well, that shows the information is there. It does not show the model uses sentiment to answer. To test that, change or remove the feature and see what happens.

Adding an arrow to change behavior is called **steering**. It can change tone on tested prompts without proving the change is safe elsewhere.

## Trace a behavior

A set of parts that helps produce a behavior is called a **circuit**. Anthropic's open-source circuit-tracer draws links between features and outputs. Its May 2025 examples include Gemma-2-2B and Llama-3.2-1B.

These graphs show only part of the work for one input. Test claimed links by changing features on new prompts. A neat graph, like a neat written explanation, is not a full account of how the model thinks.

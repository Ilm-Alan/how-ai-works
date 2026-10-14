Neural networks mostly work with lists and grids of numbers. They multiply these numbers, apply small functions, and turn scores into chances. You need a few tools to read what they do.

## Lists and grids

A list of numbers is a **vector**. A language model stores each token as such a list. Llama 3 8B uses 4,096 numbers per token; DeepSeek-V3 uses 7,168.

Multiply matching entries in two lists, then add the results. This is the **dot product**. For [1, 2] and [3, 4], it gives 11. It helps compare which way two vectors point. Dividing out their lengths gives **cosine similarity**, a score from −1 to 1.

A grid of numbers is a **matrix**. To multiply a matrix by a vector, take each row's dot product with that vector. The result is another vector. This can stretch, turn, or flip space, but straight lines stay straight.

{{lab}}

Set a to 1, b to 0, c to 0, and d to 1. Leave v.x and v.y at 1. The mapped vector is (1, 1), and area scale is 1. Now set d to 0. The result is (1, 0), and area scale is 0: the plane has collapsed onto a line.

That area scale is the **determinant**. A zero value means the map loses information. Stacking matrices alone still makes just one matrix map. Networks need functions between them to make curved shapes.

For matrix products, the inner sizes must match. A 2-by-3 matrix times a 3-by-4 matrix gives a 2-by-4 result.

## Turn scores into chances

A model gives each possible answer a score, called a **logit**. **Softmax** turns those scores into positive chances that sum to 1.

The **temperature** setting controls how spread out those chances are. Low values favor the top score. High values make the choices more even. Adding the same number to every score changes no chances.

The spread is called **entropy**. It is 0 bits for one certain choice and about 2.32 bits for five equal choices.

## Score a wrong guess

Training charges the model for giving the right answer a low chance:

$$L=-\ln p(\text{right answer}).$$

This is **cross-entropy loss**. A chance of 1 costs 0; a chance of 0.5 costs about 0.69. A confident wrong guess costs much more. Logs also let us add scores for long sequences instead of multiplying tiny chances.

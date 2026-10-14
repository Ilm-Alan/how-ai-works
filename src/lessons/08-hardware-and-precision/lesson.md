A fast chip can sit idle while it waits for numbers. To run a model well, you need enough speed, enough memory, and a number format that fits the task.

## Speed needs a supply of data

Graphics chips and Google's Tensor Processing Units do many matrix multiplies at once. A multiply followed by an add counts as two **FLOPs**, or floating-point operations. FLOPs per second measure speed, not model quality.

Memory next to the chip is **HBM**, or high-bandwidth memory. Its size tells you what fits. Its bandwidth tells you how fast the chip can read data.

Work done per byte read or written is **arithmetic intensity**. Reuse the same numbers for more work, and this rises. The speed limit, called a **roofline**, is:

$$\text{speed} = \min(\text{chip peak},\ \text{bandwidth} \times \text{work per byte}).$$

The lower of those two limits wins. More chip speed will not help when memory is the limit.

{{lab}}

Keep BF16 selected. Raise matrix side from 1,024 to 2,048: work per byte doubles from 341.33 to 682.67. Raise decode batch from 1 to 8: it rises from 1 to 8. More items share each read of the model's weights. Try doubling chip peak; a memory-limited result stays the same.

## Fewer bits, less detail

Number formats split bits between sign, range, and fine detail. Both BF16 and FP16 use two bytes. BF16 can hold much larger numbers; FP16 keeps finer steps near 1. Neither stores every real number exactly.

FP8 uses one byte. FP4 uses half a byte before extra scale data. Smaller formats save space and reads, but round more. Scales let small stored numbers stand for a wider range.

As of October 2026, NVIDIA has shown FP4 training, while keeping more precise numbers for sensitive parts. Small formats do not mean every part of training uses that format.

## Fitting is a separate question

A 70-billion-weight model needs 140 GB just for BF16 weights. The lab's training rule uses 16 bytes per weight, or 1,120 GB, before other working memory. Set parameters (billions) to 70 and switch memory use to see the gap.

More chips can share the model, but they must exchange data. Fast local memory does not remove that cost. Compare real tasks, not just vendor peaks. October 2026 specifications still list Rubin as preliminary; its listed FP4 peak is for training, not a measured application speed.

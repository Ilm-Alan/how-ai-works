Training changes a model's weights a little at a time. A full run must choose how large those changes should be. It must also save enough state to recover from a failed device.

## Set the pace

The amount of text used for one update is the **batch size**. Several devices can each process different text. Small batches can also be combined before an update. This is called **gradient accumulation**. Devices that split the same matrix calculation do not add more training text.

The size of each weight update depends on the **learning rate**. Start small, then raise it: this is **warmup**. A constant rate then stays flat. Cosine decay lowers it smoothly. A third plan holds it flat, then lowers it near the end: **warmup-stable-decay**.

{{lab}}

Set peak learning rate to 0.12 and press start. The warmup-stable-decay run lowers its rate over the last 80 updates. Its mean squared error falls from 0.0365 over steps 280–319 to 0.0061 over steps 360–399. Pause near step 200 and press branch decay now to end a copy of the constant run sooner. All runs see the same batches, so the rate plan causes the differences.

## Make updates work

The rule that turns gradients into weight changes is the **optimizer**. AdamW tracks recent gradients and their squared sizes. Muon instead reshapes updates to weight matrices. Kimi K2 used a version called MuonClip and reported 15.5 trillion training tokens without loss spikes.

Using fewer bits for costly math while keeping sensitive state more precise is **mixed precision**. It does not mean every number uses the same format. NVIDIA reported a 12-billion-weight model trained on 10 trillion tokens with its four-bit NVFP4 recipe. Its MMLU-Pro score was 62.58%, versus 62.62% for the eight-bit baseline.

## Save more than weights

A saved training state is a **checkpoint**. To resume the same run, save weights, optimizer state, the rate plan's position, the data position, and random state. Weights alone let you run the model, but not repeat its training path.

This matters at scale: Mistral reported 3,800 GPUs for Large 4 in October 2026. One failed device can stop the job. Splitting weights and training state across devices saves memory, but also adds data transfers between them.

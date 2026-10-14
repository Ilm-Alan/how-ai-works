Storing model numbers in fewer bits is **quantization**. A model with 70 billion weights needs 140 GB at 16 bits per weight. Eight bits takes 70 GB; four bits takes about 35–40 GB, with scales included. Reading fewer bytes can speed up generation and fit a model on fewer GPUs.

## Scale, round, store

A four-bit integer format, **INT4**, has evenly spaced values. In this lab they run from −7 to 7. Pick a **scale** that maps the largest weight to 7. Divide each weight by that scale, round it, and store the small integer. To read it back, multiply by the scale.

One very large weight forces a large scale. Small weights can then round to zero. Sharing a separate scale within each small block limits that damage.

{{lab}}

Start with INT4, one scale per whole tensor, and 8 outlier weights on. About 91% of the weights round to zero and relative error is about 79%. Change one scale per to block of 32. Only each outlier's own block suffers: about 14% of weights become zero and error falls to about 13%. Each block stores a 16-bit scale, which adds half a bit per weight. The bits per weight readout includes this cost.

## Use uneven steps

Floating-point formats put steps closer together near zero and farther apart for large numbers. **FP8** uses eight bits. DeepSeek-V3 was trained with FP8 in December 2024; low-bit formats are not just for running finished models.

Four-bit floating point, **FP4**, has only eight possible sizes, including zero. It needs small blocks with shared scales. The **MXFP4** format uses blocks of 32 and takes 4.25 bits per weight. OpenAI released gpt-oss with MXFP4 weights in August 2025, fitting its 117-billion-weight model on one 80 GB GPU. NVIDIA's **NVFP4** uses blocks of 16 and finer scales, taking about 4.5 bits per weight.

## Keep the useful detail

Better methods test rounding on sample inputs. Adjusting remaining weights to offset rounding errors is the idea behind **GPTQ**. Giving more detail to weights whose inputs matter most is the idea behind **AWQ**. Training with rounded weights in the forward pass is **quantization-aware training**: the model learns to cope with rounding.

Eight-bit weights often lose little quality. Four-bit results depend more on the method and task. Check math, code, and long documents on your own workload. A smaller model file alone does not prove the answers stayed good.

// Real, dated data series. Values copied from the sources below on 2026-10-14.

export interface Series {
  id: string;
  label: string;
  unit: string;
  /** [ISO date, label, value] */
  points: [string, string, number][];
  source: { label: string; url: string };
  /** Points above this value are shown but excluded from fits (the source says they're unreliable). */
  reliableMax?: number;
}

export const series: Series[] = [
  {
    id: "metr",
    label: "Task length AI agents complete 50% of the time (METR)",
    unit: "minutes of human expert time",
    // METR Time Horizon 1.1, p50 estimates for models METR marks as state of the art at release.
    points: [
      ["2019-02-14", "GPT-2", 0.1],
      ["2020-05-28", "GPT-3", 0.1],
      ["2022-03-15", "GPT-3.5 Turbo Instruct", 0.6],
      ["2023-03-14", "GPT-4", 4.0],
      ["2023-11-06", "GPT-4 (Nov 2023)", 4.0],
      ["2024-05-13", "GPT-4o", 7.0],
      ["2024-06-20", "Claude 3.5 Sonnet (Jun 2024)", 11.4],
      ["2024-09-12", "o1-preview", 20.3],
      ["2024-10-22", "Claude 3.5 Sonnet (Oct 2024)", 20.5],
      ["2024-12-05", "o1", 38.8],
      ["2025-02-24", "Claude 3.7 Sonnet", 60.4],
      ["2025-04-16", "o3", 119.7],
      ["2025-08-07", "GPT-5", 203.0],
      ["2025-11-18", "Gemini 3 Pro", 224.3],
      ["2025-11-24", "Claude Opus 4.5", 293.0],
      ["2025-12-11", "GPT-5.2", 352.2],
      ["2026-02-05", "Claude Opus 4.6", 718.8],
      ["2026-04-07", "Claude Mythos Preview (early)", 1044.8],
    ],
    reliableMax: 16 * 60,
    source: { label: "METR, Time Horizon 1.1 results (last updated Sept 2026)", url: "https://metr.org/assets/benchmark_results_1_1.yaml" },
  },
  {
    id: "compute",
    label: "Largest training run to date (Epoch AI estimates)",
    unit: "training FLOP",
    // Models that set a new record for estimated training compute, confidence "Confident" or "Likely".
    points: [
      ["2018-05-02", "ResNeXt-101 32x48d", 8.74e21],
      ["2019-09-17", "Megatron-BERT", 2.2e22],
      ["2019-10-23", "T5-11B", 3.3e22],
      ["2019-10-30", "AlphaStar", 1.08e23],
      ["2020-01-28", "Meena", 1.12e23],
      ["2020-05-28", "GPT-3 175B", 3.14e23],
      ["2021-08-11", "Jurassic-1-Jumbo", 3.7e23],
      ["2021-09-03", "FLAN 137B", 2.05e24],
      ["2022-06-29", "Minerva 540B", 2.74e24],
      ["2023-03-15", "GPT-4", 2.1e25],
      ["2025-02-17", "Grok 3", 3.5e26],
      ["2025-02-27", "GPT-4.5", 3.8e26],
      ["2026-09-03", "GPT-6 Astra", 1e27],
    ],
    source: { label: "Epoch AI, Notable AI Models dataset (accessed Oct 2026)", url: "https://epoch.ai/data/notable-ai-models" },
  },
];

import { rng } from "../../lib/rng";
export const schema = {
  type: "object", properties: { action: { type: "string", enum: ["search", "lookup"] }, limit: { type: "integer", minimum: 1, maximum: 3 }, confirm: { type: "boolean" } },
  required: ["action", "limit", "confirm"], additionalProperties: false,
} as const;
export const vocabulary = ["{", "}", ":", ",", '"action"', '"limit"', '"confirm"', '"search"', '"lookup"', "1", "2", "3", "true", "false", "<end>"];
export type State = "start" | "action-key" | "action-colon" | "action-value" | "action-comma" | "limit-key" | "limit-colon" | "limit-value" | "limit-comma" | "confirm-key" | "confirm-colon" | "confirm-value" | "close" | "end" | "done" | "dead";
const allowed: Record<State, readonly string[]> = {
  start: ["{"], "action-key": ['"action"'], "action-colon": [":"], "action-value": ['"search"', '"lookup"'], "action-comma": [","],
  "limit-key": ['"limit"'], "limit-colon": [":"], "limit-value": ["1", "2", "3"], "limit-comma": [","],
  "confirm-key": ['"confirm"'], "confirm-colon": [":"], "confirm-value": ["true", "false"], close: ["}"], end: ["<end>"], done: [], dead: [],
};
const nextState: Record<State, State> = { start: "action-key", "action-key": "action-colon", "action-colon": "action-value", "action-value": "action-comma", "action-comma": "limit-key", "limit-key": "limit-colon", "limit-colon": "limit-value", "limit-value": "limit-comma", "limit-comma": "confirm-key", "confirm-key": "confirm-colon", "confirm-colon": "confirm-value", "confirm-value": "close", close: "end", end: "done", done: "dead", dead: "dead" };
export function allowedTokens(state: State): readonly string[] { return allowed[state]; }
export function advance(state: State, token: string): State { return allowed[state].includes(token) ? nextState[state] : "dead"; }
// A count-based bigram model fitted to all 12 combinations, with additive smoothing.
const counts = new Map<string, number[]>();
for (const action of ['"search"', '"lookup"']) for (const limit of ["1", "2", "3"]) for (const confirm of ["true", "false"]) {
  const sequence = ["{", '"action"', ":", action, ",", '"limit"', ":", limit, ",", '"confirm"', ":", confirm, "}", "<end>"];
  let previous = "<start>";
  for (const token of sequence) {
    let row = counts.get(previous);
    if (!row) { row = Array<number>(vocabulary.length).fill(0); counts.set(previous, row); }
    row[vocabulary.indexOf(token)]! += 1;
    previous = token;
  }
}
export interface Options { masked: boolean; seed: number; temperature: number; noise: number }
export interface Step { prefix: string; state: State; allowed: readonly string[]; before: number[]; after: number[]; chosen: string }
export interface Generation { text: string; valid: boolean; completed: boolean; steps: Step[] }
export function distribution(previous: string, state: State, options: Options): { before: number[]; after: number[] } {
  const row = counts.get(previous);
  const weights = vocabulary.map((_, i) => Math.pow((row?.[i] ?? 0) + 0.05 + options.noise, 1 / options.temperature));
  const total = weights.reduce((s, w) => s + w, 0);
  const before = weights.map(w => w / total);
  const after = before.map((p, i) => !options.masked || allowed[state].includes(vocabulary[i]!) ? p : 0);
  const remaining = after.reduce((s, p) => s + p, 0);
  if (remaining) for (let i = 0; i < after.length; i++) after[i]! /= remaining;
  return { before, after };
}
export function matchesSchema(text: string): boolean {
  try {
    const value: unknown = JSON.parse(text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const obj = value as Record<string, unknown>;
    return Object.keys(obj).length === 3 && (obj.action === "search" || obj.action === "lookup") && typeof obj.limit === "number" && Number.isInteger(obj.limit) && obj.limit >= 1 && obj.limit <= 3 && typeof obj.confirm === "boolean";
  } catch { return false; }
}
export function generate(options: Options, trace = true): Generation {
  const random = rng(options.seed);
  const steps: Step[] = [];
  let state: State = "start", previous = "<start>", text = "", completed = false;
  for (let i = 0; i < 32; i++) {
    const { before, after } = distribution(previous, state, options);
    let mass = random.next(), chosen = vocabulary[vocabulary.length - 1]!;
    for (let j = 0; j < after.length; j++) { mass -= after[j]!; if (mass < 0) { chosen = vocabulary[j]!; break; } }
    if (trace) steps.push({ prefix: text, state, allowed: allowed[state], before, after, chosen });
    state = advance(state, chosen);
    if (chosen === "<end>") { completed = state === "done"; break; }
    text += chosen; previous = chosen;
  }
  return { text, valid: matchesSchema(text), completed, steps };
}
export function validityRate(options: Options, samples = 200): number {
  let valid = 0;
  for (let i = 0; i < samples; i++) if (generate({ ...options, seed: options.seed + i }, false).valid) valid++;
  return valid / samples;
}

export interface Prices { input: number; write: number; read: number; output: number }
export const DEFAULT_PRICES: Prices = { input: 2, write: 2.5, read: 0.1, output: 10 };
export interface Config {
  // Provider order: tools, system, documents; history and user follow the breakpoint.
  parts: [number, number, number];
  history: number;
  user: number;
  output: number;
  turns: number;
  cache: boolean;
  boundary: 0 | 1 | 2;
  changedPart: -1 | 0 | 1 | 2 | 3;
  changeEvery: number;
  gapSeconds: number;
  ttlSeconds: number;
  minimum: number;
  prices: Prices;
  prefillRate: number;
  cacheRate: number;
  decodeRate: number;
}
export interface Turn {
  turn: number;
  input: number;
  regular: number;
  written: number;
  read: number;
  cost: number;
  uncachedCost: number;
  ttft: number;
  seconds: number;
  uncachedSeconds: number;
  status: "off" | "below minimum" | "write" | "hit";
}
export function conversation(c: Config): Turn[] {
  const prefix = c.parts.slice(0, c.boundary + 1).reduce((s, n) => s + n, 0);
  const fixed = c.parts.reduce((s, n) => s + n, 0);
  let lastKey: number | undefined;
  let lastAccess = -Infinity;
  const turns: Turn[] = [];
  for (let t = 0; t < c.turns; t++) {
    const input = fixed + c.history + t * (c.user + c.output) + c.user;
    const key = c.changedPart >= 0 && c.changedPart <= c.boundary ? Math.floor(t / c.changeEvery) : 0;
    const now = t * c.gapSeconds;
    const eligible = c.cache && prefix >= c.minimum && prefix > 0;
    const hit = eligible && key === lastKey && now - lastAccess < c.ttlSeconds;
    const read = hit ? prefix : 0;
    const written = eligible && !hit ? prefix : 0;
    const regular = input - read - written;
    if (eligible) { lastKey = key; lastAccess = now; }
    const cost = (regular * c.prices.input + written * c.prices.write + read * c.prices.read + c.output * c.prices.output) / 1e6;
    const ttft = (regular + written) / c.prefillRate + read / c.cacheRate;
    turns.push({
      turn: t + 1, input, regular, written, read, cost,
      uncachedCost: (input * c.prices.input + c.output * c.prices.output) / 1e6,
      ttft, seconds: ttft + c.output / c.decodeRate,
      uncachedSeconds: input / c.prefillRate + c.output / c.decodeRate,
      status: !c.cache ? "off" : !eligible ? "below minimum" : hit ? "hit" : "write",
    });
  }
  return turns;
}

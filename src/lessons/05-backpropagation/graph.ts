export interface Inputs { x1: number; x2: number; w1: number; w2: number; b: number; target: number }
export const defaults: Inputs = { x1: 0.7, x2: -0.4, w1: 0.8, w2: -0.5, b: 0.1, target: 0.2 };
export interface GraphNode {
  name: string;
  parents: number[];
  formula: string;
  forward: (values: number[]) => number;
  partials: (values: number[]) => number[];
}
export const nodes: GraphNode[] = [
  ...(["x1", "x2", "w1", "w2", "b", "target"] as const).map(name => ({ name, parents: [], formula: "editable input", forward: () => 0, partials: () => [] })),
  { name: "p1", parents: [0, 2], formula: "x1 × w1", forward: v => v[0]! * v[2]!, partials: v => [v[2]!, v[0]!] },
  { name: "p2", parents: [1, 3], formula: "x2 × w2", forward: v => v[1]! * v[3]!, partials: v => [v[3]!, v[1]!] },
  { name: "z", parents: [6, 7, 4], formula: "p1 + p2 + b", forward: v => v[6]! + v[7]! + v[4]!, partials: () => [1, 1, 1] },
  { name: "a", parents: [8], formula: "tanh(z)", forward: v => Math.tanh(v[8]!), partials: v => [1 - Math.tanh(v[8]!) ** 2] },
  { name: "e", parents: [9, 5], formula: "a − target", forward: v => v[9]! - v[5]!, partials: () => [1, -1] },
  { name: "L", parents: [10], formula: "½ × e²", forward: v => 0.5 * v[10]! ** 2, partials: v => [v[10]!] },
];
export function leafValues(inputs: Inputs): number[] {
  return [inputs.x1, inputs.x2, inputs.w1, inputs.w2, inputs.b, inputs.target];
}
export function evaluate(inputs: Inputs, override?: { node: number; value: number }): number[] {
  const values = leafValues(inputs);
  for (let i = 0; i < nodes.length; i++) {
    if (i >= 6) values[i] = nodes[i]!.forward(values);
    if (override?.node === i) values[i] = override.value;
  }
  return values;
}
/** One reverse-mode node: accumulate, rather than replace, each parent's contribution. */
export function backwardNode(index: number, values: number[], gradients: number[]): void {
  const node = nodes[index]!;
  const local = node.partials(values);
  for (let j = 0; j < node.parents.length; j++) {
    const parent = node.parents[j]!;
    gradients[parent] = gradients[parent]! + gradients[index]! * local[j]!;
  }
}
export function gradients(inputs: Inputs): number[] {
  const values = evaluate(inputs), grads = nodes.map(() => 0);
  grads[11] = 1;
  for (let i = nodes.length - 1; i >= 0; i--) backwardNode(i, values, grads);
  return grads;
}
/** Perturb one node independently, recomputing its descendants with all other inputs fixed. */
export function finiteDifferences(inputs: Inputs, epsilon = 1e-5): number[] {
  const values = evaluate(inputs);
  return nodes.map((_, node) => {
    const value = values[node]!;
    const plus = evaluate(inputs, { node, value: value + epsilon })[11]!;
    const minus = evaluate(inputs, { node, value: value - epsilon })[11]!;
    return (plus - minus) / (2 * epsilon);
  });
}

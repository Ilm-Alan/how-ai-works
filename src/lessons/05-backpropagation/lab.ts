import { button, cols, fmt, h, note, readout, row, slider } from "../../ui/kit";
import { chart } from "../../ui/plot";
import { backwardNode, defaults, finiteDifferences, leafValues, nodes, type Inputs } from "./graph";

const positions: [number, number][] = [[0, 6], [0, 4], [0, 5], [0, 3], [1.5, 1], [3.5, 0.7], [1.5, 5.5], [1.5, 3.5], [3, 4.5], [4.3, 4.5], [5.5, 3], [6.7, 3]];

export function mount(root: HTMLElement) {
  const inputs = { ...defaults };
  let values = leafValues(inputs), grads = nodes.map(() => 0);
  let forward = 6, backward = 11, active = -1, seeded = false;
  const view = h("div"), table = h("table");
  const graph = chart(view, { x: [-0.5, 7.3], y: [0, 7], axes: false, height: 330 });
  const status = readout("current step"), error = readout("largest slope check error");
  function draw() {
    graph.clear();
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = positions[i]!;
      for (const p of nodes[i]!.parents) {
        const [px, py] = positions[p]!;
        graph.arrow(px + 0.2, py, x - 0.25, y, { color: active === i ? graph.pal.accent : graph.pal.border, width: active === i ? 2 : 1 });
      }
    }
    for (let i = 0; i < nodes.length; i++) {
      const [x, y] = positions[i]!;
      graph.points([x], [y], { r: 5, color: i === active ? graph.pal.accent : graph.pal.muted });
      graph.text(x, y + 0.3, nodes[i]!.name, { align: "center" });
      graph.text(x, y - 0.3, i < forward ? fmt(values[i]!) : "?", { align: "center", size: 11 });
    }
    const finished = seeded && backward < 0;
    const check = finished ? finiteDifferences(inputs) : [];
    table.replaceChildren(h("thead", null, h("tr", null, ...["Node", "Formula", "Value", "Loss slope", "Small-change check"].map(s => h("th", { scope: "col" }, s)))));
    const body = h("tbody");
    for (let i = 0; i < nodes.length; i++) body.append(h("tr", null,
      h("th", { scope: "row" }, `${active === i ? "→ " : ""}${nodes[i]!.name}`),
      h("td", null, nodes[i]!.formula), h("td", null, i < forward ? fmt(values[i]!, 5) : "—"),
      h("td", null, seeded ? fmt(grads[i]!, 5) : "—"), h("td", null, finished ? fmt(check[i]!, 5) : "—"),
    ));
    table.append(body);
    error.set(finished ? Math.max(...check.map((v, i) => Math.abs(v - grads[i]!))).toExponential(2) : "complete backward pass to check");
  }
  function reset() {
    values = leafValues(inputs); grads = nodes.map(() => 0);
    forward = 6; backward = 11; active = -1; seeded = false;
    status.set("inputs ready; step forward"); draw();
  }
  function stepForward() {
    if (forward === nodes.length) { status.set("forward complete; step backward"); return; }
    active = forward; values[forward] = nodes[forward]!.forward(values); forward++;
    status.set(`forward ${nodes[active]!.name}: ${nodes[active]!.formula}`); draw();
  }
  function stepBackward() {
    if (forward < nodes.length) { status.set("finish the forward pass first"); return; }
    if (!seeded) { grads[11] = 1; seeded = true; }
    if (backward < 0) { status.set("backward complete; all gradients checked"); return; }
    active = backward;
    backwardNode(backward, values, grads);
    const node = nodes[backward]!;
    status.set(node.parents.length ? `${node.name}: pass the loss slope to ${node.parents.map(p => nodes[p]!.name).join(", ")}` : `${node.name}: slope ready`);
    backward--; draw();
  }
  root.append(
    row(...(Object.keys(inputs) as (keyof Inputs)[]).map(key => slider({ label: key, min: -2, max: 2, step: 0.1, value: inputs[key], onInput: v => { inputs[key] = v; reset(); } }))),
    row(button("Step forward", stepForward, "primary"), button("Step backward", stepBackward), button("Reset passes", reset)),
    row(status, error), cols(view, h("div", { style: "overflow-x:auto" }, table)),
    note("The last column checks slopes by making small changes."),
  );
  reset();
}

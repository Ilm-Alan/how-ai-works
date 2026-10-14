import { cols, h, toggle } from "../../ui/kit";
import { analyze, type Config } from "./permissions";

const CAPS: { key: keyof Config; label: string }[] = [
  { key: "untrusted", label: "reads untrusted text" },
  { key: "privateData", label: "reads private data" },
  { key: "egress", label: "sends requests or messages" },
  { key: "shell", label: "runs shell commands" },
  { key: "write", label: "modifies or deletes files" },
];

const MITIGATIONS: { key: keyof Config; label: string }[] = [
  { key: "approval", label: "human approves every risky action" },
  { key: "quarantine", label: "separate tool-free model reads untrusted text" },
  { key: "sandbox", label: "shell has no network or private files" },
  { key: "allowlist", label: "outbound requests limited to fixed hosts" },
];

export function mount(root: HTMLElement) {
  const cfg: Config = {
    untrusted: true,
    privateData: true,
    egress: true,
    shell: false,
    write: false,
    approval: false,
    quarantine: false,
    sandbox: false,
    allowlist: false,
  };
  const out = h("div", { class: "findings" });

  function draw() {
    const { trifecta, findings } = analyze(cfg);
    out.replaceChildren(
      h(
        "p",
        null,
        h("strong", null, trifecta ? "Lethal trifecta present. " : "No lethal trifecta. "),
        trifecta
          ? "Untrusted input, private data, and a way out are all available to the same agent."
          : "At least one of untrusted input, private data, or an outbound channel is missing.",
      ),
      findings.length === 0
        ? h("p", null, "No path found from attacker-written text to a harmful action.")
        : h(
            "ol",
            null,
            ...findings.map((f) => h("li", null, h("strong", null, `${f.kind}: `), f.path.join(" → "))),
          ),
    );
  }

  const group = (title: string, items: { key: keyof Config; label: string }[]) =>
    h(
      "div",
      null,
      h("h3", null, title),
      ...items.map((it) => h("div", null, toggle({ label: it.label, value: cfg[it.key], onChange: (v) => ((cfg[it.key] = v), draw()) }))),
    );

  root.append(cols(group("What the agent can do", CAPS), group("Safeguards", MITIGATIONS)), h("h3", null, "Attack paths"), out);
  draw();
}

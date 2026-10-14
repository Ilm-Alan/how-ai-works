import { expect, test } from "bun:test";
import { analyze, type Config } from "./permissions";

const none: Config = {
  untrusted: false,
  privateData: false,
  egress: false,
  shell: false,
  write: false,
  approval: false,
  quarantine: false,
  sandbox: false,
  allowlist: false,
};

const trifecta: Config = { ...none, untrusted: true, privateData: true, egress: true };

test("all three legs with no mitigation is an exfiltration path", () => {
  const r = analyze(trifecta);
  expect(r.trifecta).toBe(true);
  expect(r.findings.map((f) => f.kind)).toEqual(["exfiltration"]);
});

test("removing any one leg removes the exfiltration path", () => {
  for (const leg of ["untrusted", "privateData", "egress"] as const) {
    expect(analyze({ ...trifecta, [leg]: false }).findings).toEqual([]);
  }
});

test("each mitigation that breaks the flow removes the path", () => {
  for (const m of ["approval", "quarantine", "allowlist"] as const) {
    expect(analyze({ ...trifecta, [m]: true }).findings).toEqual([]);
  }
});

test("a shell is an exfiltration channel unless sandboxed, and an allowlist doesn't cover it", () => {
  const withShell = { ...trifecta, egress: false, shell: true, allowlist: true };
  expect(analyze(withShell).findings.map((f) => f.kind)).toEqual(["exfiltration", "damage"]);
  expect(analyze({ ...withShell, sandbox: true }).findings).toEqual([]);
});

test("write access plus untrusted input is a damage path even without private data", () => {
  const r = analyze({ ...none, untrusted: true, write: true });
  expect(r.trifecta).toBe(false);
  expect(r.findings.map((f) => f.kind)).toEqual(["damage"]);
});

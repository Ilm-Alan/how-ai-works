// Data-flow analysis of an agent's capabilities: can text an attacker controls end up steering
// a tool that leaks private data or does damage?

export interface Config {
  /** Reads content others can write: web pages, inbound email, issues, documents. */
  untrusted: boolean;
  /** Can read private data: files, inbox, database, credentials. */
  privateData: boolean;
  /** Can make outbound requests or send messages. */
  egress: boolean;
  /** Can run shell commands. */
  shell: boolean;
  /** Can modify or delete files and records. */
  write: boolean;
  /** A human approves every outbound, shell, and destructive action before it runs. */
  approval: boolean;
  /** Untrusted text is only processed by a separate model that has no tools and whose output can't trigger tool calls. */
  quarantine: boolean;
  /** Shell commands run in a sandbox with no network and no access outside a scratch directory. */
  sandbox: boolean;
  /** Outbound requests only reach a fixed allowlist of hosts the attacker cannot control. */
  allowlist: boolean;
}

export interface Finding {
  kind: "exfiltration" | "damage";
  path: string[];
}

export function analyze(c: Config): { trifecta: boolean; findings: Finding[] } {
  const trifecta = c.untrusted && c.privateData && (c.egress || c.shell);
  const findings: Finding[] = [];
  const attackerSteers = c.untrusted && !c.quarantine;
  if (!attackerSteers || c.approval) return { trifecta, findings };

  const entry = ["attacker-written content", "model context"];
  if (c.privateData) {
    if (c.egress && !c.allowlist) findings.push({ kind: "exfiltration", path: [...entry, "read private data", "outbound request to attacker"] });
    if (c.shell && !c.sandbox) findings.push({ kind: "exfiltration", path: [...entry, "read private data", "shell command (curl, git push…)"] });
  }
  if (c.write) findings.push({ kind: "damage", path: [...entry, "modify or delete files"] });
  if (c.shell && !c.sandbox) findings.push({ kind: "damage", path: [...entry, "arbitrary shell command on the host"] });
  return { trifecta, findings };
}

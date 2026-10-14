export type Style = "llama3" | "harmony";
export type Turn = { role: "system" | "user" | "assistant" | "tool"; content: string; name?: string; recipient?: string };
export type Piece = { text: string; trained: boolean };

/** Teaching tokenizer: special markers, whitespace, words and punctuation; not vendor BPE. */
export function tokenize(text: string): string[] {
  return text.match(/<\|[^|]+\|>|\s+|[\p{L}\p{N}_]+|[^\s]/gu) ?? [];
}
export function render(turns: Turn[], style: Style, assistantOnly = true): Piece[] {
  if (style === "llama3" && turns.some(t => t.role === "tool" || t.recipient)) {
    throw new Error("The verified Llama 3 format supports system/user/assistant only. Use Harmony for tools.");
  }
  const pieces: Piece[] = [];
  const add = (text: string, trained: boolean) => pieces.push(...tokenize(text).map(text => ({ text, trained })));
  if (style === "llama3") add("<|begin_of_text|>", false);
  for (const t of turns) {
    const trained = !assistantOnly || t.role === "assistant";
    if (style === "llama3") {
      add(`<|start_header_id|>${t.role}<|end_header_id|>\n\n`, false);
      add(t.content.trim() + "<|eot_id|>", trained);
    } else {
      if (t.role === "tool" && !t.name) throw new Error("Harmony tool turns need a name, such as functions.lookup.");
      const author = t.role === "tool" ? t.name! : t.role;
      const channel = t.role === "assistant" ? `<|channel|>${t.recipient ? "commentary" : "final"}` : "";
      add(`<|start|>${author}${t.recipient ? ` to=${t.recipient}` : ""}${channel}<|message|>`, false);
      add(t.content, trained);
      add(t.role === "assistant" ? (t.recipient ? "<|call|>" : "<|return|>") : "<|end|>", trained);
    }
  }
  return pieces;
}
export function parseTurns(text: string): Turn[] {
  const value: unknown = JSON.parse(text);
  if (!Array.isArray(value) || value.length === 0 || value.length > 50) throw new Error("Enter 1–50 conversation turns as a JSON array.");
  return value.map((t: unknown) => {
    if (typeof t !== "object" || t === null) throw new Error("Each turn must be an object.");
    const o = t as Record<string, unknown>;
    if (!["system", "user", "assistant", "tool"].includes(String(o.role)) || typeof o.content !== "string") throw new Error("Each turn needs a supported role and string content.");
    if (o.content.length > 4000) throw new Error("Keep each turn below 4,000 characters.");
    for (const key of ["name", "recipient"]) if (o[key] !== undefined && (typeof o[key] !== "string" || !/^[\w.]+$/.test(o[key] as string))) throw new Error(`${key} must be a simple tool identifier.`);
    return { role: o.role as Turn["role"], content: o.content, name: o.name as string | undefined, recipient: o.recipient as string | undefined };
  });
}

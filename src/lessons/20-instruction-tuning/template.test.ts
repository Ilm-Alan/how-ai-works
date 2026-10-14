import { expect, test } from "bun:test";
import { parseTurns, render, tokenize } from "./template";
test("Llama headers, separators and assistant target mask", () => {
  const p = render([{ role: "user", content: "Hi" }, { role: "assistant", content: "Hello" }], "llama3");
  expect(p.map(x => x.text).join("")).toBe("<|begin_of_text|><|start_header_id|>user<|end_header_id|>\n\nHi<|eot_id|><|start_header_id|>assistant<|end_header_id|>\n\nHello<|eot_id|>");
  expect(p.filter(x => x.trained).map(x => x.text)).toEqual(["Hello", "<|eot_id|>"]);
});
test("Harmony tool handoff and final stop are distinct", () => {
  const p = render([{ role: "assistant", recipient: "functions.lookup", content: "{}" }, { role: "tool", name: "functions.lookup", content: "4" }, { role: "assistant", content: "4" }], "harmony");
  const s = p.map(x => x.text).join("");
  expect(s).toContain("assistant to=functions.lookup<|channel|>commentary<|message|>{}<|call|>");
  expect(s).toContain("<|start|>functions.lookup<|message|>4<|end|>");
  expect(s.endsWith("4<|return|>")).toBe(true);
  expect(p.find(x => x.text === "<|call|>")?.trained).toBe(true);
});
test("mask toggles and invalid turns", () => {
  expect(render([{ role: "user", content: "Hi" }], "llama3", false).filter(x => x.trained)).toHaveLength(2);
  expect(() => render([{ role: "tool", content: "Hi" }], "llama3")).toThrow();
  expect(() => parseTurns('[{"role":"other","content":"x"}]')).toThrow();
  expect(tokenize("<|end|> x")).toEqual(["<|end|>", " ", "x"]);
});

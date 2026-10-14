import { expect, test } from "bun:test";
import { decode, encode, train } from "./bpe";
test("most frequent pair and deterministic rank", () => {
  const m = train("banana banana", 1);
  expect(m.merges[0]).toEqual({ left: 97, right: 110, id: 256, count: 4 });
  expect(encode("banana", m)).toEqual([98, 256, 256, 97]);
  expect(train("banana banana", 1)).toEqual(m);
});
test("overlap consumes bytes once", () => {
  const m = train("aaaaa", 1); expect(m.merges[0]!.count).toBe(4);
  expect(encode("aaaaa", m)).toEqual([256, 256, 97]);
});
test("UTF-8 round trip and monotone counts", () => {
  const text = "café 猫 🐇\nbanana", m = train(text, 30);
  let previous = Infinity;
  for (let k = 0; k <= m.merges.length; k++) {
    const ids = encode(text, m, k); expect(decode(ids, m)).toBe(text);
    expect(ids.length).toBeLessThanOrEqual(previous); previous = ids.length;
  }
  expect(decode(encode("unseen 🪐", m), m)).toBe("unseen 🪐");
});
test("empty input and pre-token boundaries", () => {
  expect(train("", 10).merges).toEqual([]);
  const m = train("a a a", 10); expect(m.merges).toEqual([]);
  expect(encode("", m)).toEqual([]);
  expect(() => train("x", -1)).toThrow();
});

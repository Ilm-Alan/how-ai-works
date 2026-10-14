import { describe, expect, test } from "bun:test";
import { bm25, buildIndex, fitLSA, lsaSearch, metrics, rrf, tokenize } from "./search";
import { documents, queries } from "./corpus";
describe("retrieval", () => {
  test("BM25 matches a hand-computed two-document case", () => {
    const index = buildIndex([{ id: "a", title: "", text: "cat cat" }, { id: "b", title: "", text: "dog" }]);
    // N=2, df(cat)=1, avgdl=1.5, tf=2, dl=2, k1=1.2, b=.75.
    // idf=ln(2); numerator=4.4; denominator=2+1.2*(.25+.75*2/1.5)=3.5.
    const result = bm25(index, "cat");
    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe("a");
    expect(result[0]!.score).toBeCloseTo(Math.log(2) * 4.4 / 3.5, 12);
    expect(bm25(index, "cat", 0, 0)[0]!.score).toBeCloseTo(Math.log(2), 12);
    expect(bm25(index, "unknown")).toEqual([]);
    expect(bm25(buildIndex([]), "cat")).toEqual([]);
  });
  test("RRF uses one-based rank and ignores score magnitudes", () => {
    const fused = rrf([[{ id: "a", score: 100 }, { id: "b", score: 1 }], [{ id: "b", score: 99 }, { id: "c", score: 98 }]], 60);
    expect(fused[0]!.id).toBe("b");
    expect(fused[0]!.score).toBeCloseTo(1 / 62 + 1 / 61, 12);
    expect(fused.find(r => r.id === "a")!.score).toBeCloseTo(1 / 61, 12);
    expect(rrf([], 60)).toEqual([]);
  });
  test("recall and reciprocal rank have different denominators", () => {
    const result = [{ id: "x", score: 3 }, { id: "a", score: 2 }, { id: "b", score: 1 }];
    expect(metrics(result, ["a", "b"], 2)).toEqual({ recall: 0.5, reciprocalRank: 0.5 });
    expect(metrics([], ["a"], 3)).toEqual({ recall: 0, reciprocalRank: 0 });
    expect(metrics(result, [], 3)).toEqual({ recall: 0, reciprocalRank: 0 });
    expect(metrics(result, ["a"], 0).recall).toBe(0);
  });
  test("full-rank LSA preserves exact query direction and has orthonormal axes", () => {
    const model = fitLSA(buildIndex([{ id: "a", title: "", text: "cat kitten cat" }, { id: "b", title: "", text: "dog puppy" }, { id: "c", title: "", text: "cat dog pet" }]), 3);
    const result = lsaSearch(model, "cat kitten cat");
    expect(result[0]!.id).toBe("a");
    expect(result[0]!.score).toBeCloseTo(1, 8);
    for (let i = 0; i < model.basis.length; i++) for (let j = 0; j < model.basis.length; j++) {
      const dot = model.basis[i]!.reduce((s, x, k) => s + x * model.basis[j]![k]!, 0);
      expect(dot).toBeCloseTo(i === j ? 1 : 0, 7);
    }
    expect(lsaSearch(model, "unknown")).toEqual([]);
    expect(fitLSA(buildIndex([])).basis).toEqual([]);
  });
  test("corpus labels exist and rankings are deterministic", () => {
    const ids = new Set(documents.map(d => d.id));
    expect(ids.size).toBe(40);
    for (const q of queries) for (const id of q.relevant) expect(ids.has(id)).toBe(true);
    const index = buildIndex(documents);
    const a = fitLSA(index, 8), b = fitLSA(index, 8);
    expect(lsaSearch(a, queries[0]!.text)).toEqual(lsaSearch(b, queries[0]!.text));
    expect(tokenize("The CAT, cat 429!")).toEqual(["cat", "cat", "429"]);
  });
});

import { describe, it, expect } from "vitest";
import { SearchTermExtractor } from "./term-extractor.js";

describe("SearchTermExtractor", () => {
  const extractor = new SearchTermExtractor();

  describe("extractTerms", () => {
    it("removes stop words", () => {
      const terms = extractor.extractTerms("the error is in the code");
      expect(terms).not.toContain("the");
      expect(terms).not.toContain("is");
      expect(terms).toContain("error");
      expect(terms).toContain("code");
    });

    it("filters words shorter than 3 chars", () => {
      const terms = extractor.extractTerms("an rx op error");
      expect(terms).not.toContain("rx");
      expect(terms).not.toContain("op");
      expect(terms).toContain("error");
    });

    it("lowercases input", () => {
      const terms = extractor.extractTerms("BroadcastTransaction FAILED");
      expect(terms).toContain("broadcasttransaction");
      expect(terms).toContain("failed");
    });

    it("removes punctuation and special chars", () => {
      const terms = extractor.extractTerms("error! @midl/core #123");
      expect(terms).toContain("error");
      expect(terms).toContain("midl");
      expect(terms).toContain("core");
      expect(terms).toContain("123");
    });

    it("deduplicates", () => {
      const terms = extractor.extractTerms("error error error crash");
      const errorCount = terms.filter((t) => t === "error").length;
      expect(errorCount).toBe(1);
    });

    it("sorts by length descending", () => {
      const terms = extractor.extractTerms("foo bars longer");
      for (let i = 1; i < terms.length; i++) {
        expect(terms[i - 1].length).toBeGreaterThanOrEqual(terms[i].length);
      }
    });

    it("returns max 8 terms", () => {
      const terms = extractor.extractTerms(
        "alpha bravo charlie delta echo foxtrot golf hotel india juliet"
      );
      expect(terms.length).toBeLessThanOrEqual(8);
    });
  });

  describe("buildSearchQuery", () => {
    it("joins first 5 terms with spaces", () => {
      const terms = ["broadcasttransaction", "timeout", "error", "wallet", "connect", "extra"];
      const query = extractor.buildSearchQuery(terms);
      expect(query).toBe("broadcasttransaction timeout error wallet connect");
    });

    it("returns all terms when fewer than 5", () => {
      const terms = ["error", "crash"];
      const query = extractor.buildSearchQuery(terms);
      expect(query).toBe("error crash");
    });
  });
});

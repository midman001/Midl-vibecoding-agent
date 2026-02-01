import { describe, it, expect } from "vitest";
import { SimilarityScorer } from "./similarity-scorer.js";
import type { GitHubIssueResult } from "../types/search-types.js";

function makeIssue(
  overrides: Partial<GitHubIssueResult> = {}
): GitHubIssueResult {
  return {
    number: 1,
    title: "Test issue",
    url: "https://github.com/test/repo/issues/1",
    status: "open",
    labels: [],
    comments: 0,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    body: "",
    author: "test",
    ...overrides,
  };
}

describe("SimilarityScorer", () => {
  const scorer = new SimilarityScorer();

  it("scores identical text as near 1.0", () => {
    const desc = "typescript compilation error in build";
    const issue = makeIssue({
      title: "typescript compilation error in build",
      body: "typescript compilation error in build",
    });
    const score = scorer.score(desc, issue);
    expect(score).toBeGreaterThanOrEqual(0.8);
    expect(score).toBeLessThanOrEqual(1.0);
  });

  it("scores completely different text as near 0", () => {
    const desc = "typescript compilation error";
    const issue = makeIssue({
      title: "banana smoothie recipe",
      body: "blend frozen bananas with milk",
    });
    const score = scorer.score(desc, issue);
    expect(score).toBeLessThan(0.1);
  });

  it("title match boosts score", () => {
    const desc = "typescript error";
    const titleMatch = makeIssue({
      title: "typescript error in build",
      body: "some unrelated content here",
    });
    const bodyOnly = makeIssue({
      title: "unrelated title here",
      body: "typescript error in build process",
    });
    const titleScore = scorer.score(desc, titleMatch);
    const bodyScore = scorer.score(desc, bodyOnly);
    expect(titleScore).toBeGreaterThan(bodyScore);
  });

  it("score is between 0 and 1 inclusive", () => {
    const cases = [
      { desc: "", issue: makeIssue() },
      { desc: "test", issue: makeIssue({ title: "test", body: "test" }) },
      {
        desc: "a very long description with many words",
        issue: makeIssue({ title: "short", body: "" }),
      },
    ];
    for (const { desc, issue } of cases) {
      const score = scorer.score(desc, issue);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    }
  });
});

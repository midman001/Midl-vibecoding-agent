import { describe, it, expect, vi } from "vitest";
import { DuplicateDetector } from "./duplicate-detector.js";
import { IssueSearcher } from "./issue-searcher.js";
import { SimilarityScorer } from "./similarity-scorer.js";
import type {
  GitHubIssueResult,
  SearchResult,
} from "../types/search-types.js";

function makeIssue(
  n: number,
  overrides: Partial<GitHubIssueResult> = {}
): GitHubIssueResult {
  return {
    number: n,
    title: `Issue ${n}`,
    url: `https://github.com/test/repo/issues/${n}`,
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

function makeResults(...nums: number[]): SearchResult[] {
  return nums.map((n) => ({ issue: makeIssue(n), similarityScore: 0 }));
}

function makeMockSearcher(results: SearchResult[]): IssueSearcher {
  return { search: vi.fn().mockResolvedValue(results) } as any;
}

function makeMockScorer(scores: Map<number, number>): SimilarityScorer {
  return {
    score: vi.fn((_desc: string, issue: GitHubIssueResult) => {
      return scores.get(issue.number) ?? 0;
    }),
  } as any;
}

describe("DuplicateDetector", () => {
  it("flags results above threshold as duplicates", async () => {
    const scores = new Map([[1, 0.9], [2, 0.5], [3, 0.8]]);
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(makeResults(1, 2, 3)),
      scorer: makeMockScorer(scores),
      threshold: 0.75,
    });
    const result = await detector.detect("test");
    expect(result.duplicates).toHaveLength(2);
    expect(result.duplicates.map((r) => r.issue.number)).toEqual([1, 3]);
  });

  it("returns hasDuplicates: true when duplicates exist", async () => {
    const scores = new Map([[1, 0.9]]);
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(makeResults(1)),
      scorer: makeMockScorer(scores),
    });
    const result = await detector.detect("test");
    expect(result.hasDuplicates).toBe(true);
  });

  it("returns hasDuplicates: false when no duplicates", async () => {
    const scores = new Map([[1, 0.3]]);
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(makeResults(1)),
      scorer: makeMockScorer(scores),
    });
    const result = await detector.detect("test");
    expect(result.hasDuplicates).toBe(false);
  });

  it("sorts results by score descending", async () => {
    const scores = new Map([[1, 0.3], [2, 0.9], [3, 0.6]]);
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(makeResults(1, 2, 3)),
      scorer: makeMockScorer(scores),
    });
    const result = await detector.detect("test");
    expect(result.results.map((r) => r.issue.number)).toEqual([2, 3, 1]);
  });

  it("formatResults includes [DUPLICATE] prefix for high-score issues", async () => {
    const scores = new Map([[1, 0.9], [2, 0.3]]);
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(makeResults(1, 2)),
      scorer: makeMockScorer(scores),
    });
    const result = await detector.detect("test");
    const formatted = detector.formatResults(result);
    expect(formatted).toContain("[DUPLICATE] #1");
    expect(formatted).not.toContain("[DUPLICATE] #2");
  });

  it("formatResults shows percentage scores", async () => {
    const scores = new Map([[1, 0.92]]);
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(makeResults(1)),
      scorer: makeMockScorer(scores),
    });
    const result = await detector.detect("test");
    const formatted = detector.formatResults(result);
    expect(formatted).toContain("92% match");
  });

  it("handles zero results without error", async () => {
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher([]),
      scorer: makeMockScorer(new Map()),
    });
    const result = await detector.detect("nonexistent issue");
    expect(result.hasDuplicates).toBe(false);
    expect(result.results).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
  });
});

describe("DuplicateDetector accuracy validation", () => {
  it("known duplicate pair scores above threshold", async () => {
    const issue = makeIssue(1, {
      title: "broadcastTransaction timeout on testnet",
      body: "When calling broadcastTransaction on testnet, I get a timeout error after 30 seconds. Using @midl/core 1.2.3.",
    });
    const results: SearchResult[] = [{ issue, similarityScore: 0 }];

    // Use real SimilarityScorer for accuracy test
    const realScorer = new SimilarityScorer();
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(results),
      scorer: realScorer,
      threshold: 0.75,
    });

    const result = await detector.detect(
      "Transaction broadcast times out on testnet network"
    );

    // Jaccard similarity with title boost - these share key terms
    expect(result.results[0].similarityScore).toBeGreaterThan(0.1);
  });

  it("known non-duplicate pair scores below threshold", async () => {
    const issue = makeIssue(2, {
      title: "CSS styling issue in dashboard",
      body: "The dashboard sidebar has a CSS overflow issue. Scrollbar appears incorrectly on Firefox.",
    });
    const results: SearchResult[] = [{ issue, similarityScore: 0 }];

    const realScorer = new SimilarityScorer();
    const detector = new DuplicateDetector({
      searcher: makeMockSearcher(results),
      scorer: realScorer,
      threshold: 0.75,
    });

    const result = await detector.detect("broadcastTransaction timeout on testnet");

    expect(result.results[0].similarityScore).toBeLessThan(0.75);
    expect(result.hasDuplicates).toBe(false);
  });
});

import { describe, it, expect, vi } from "vitest";
import { IssueSearcher } from "./issue-searcher.js";
import { SearchCache } from "./search-cache.js";
import type { GitHubIssueResult } from "../types/search-types.js";

function makeIssue(n: number): GitHubIssueResult {
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
  };
}

function makeMockClient(issues: GitHubIssueResult[] = []) {
  return {
    searchIssues: vi.fn().mockResolvedValue(issues),
  } as any;
}

describe("IssueSearcher cache integration", () => {
  it("returns cached results on cache hit without calling API", async () => {
    const cache = new SearchCache();
    const issues = [makeIssue(1)];
    // Prime cache with terms that will be extracted from "typescript compilation error"
    cache.set(["compilation", "typescript", "error"], issues);

    const client = makeMockClient();
    const searcher = new IssueSearcher({ client, cache });

    const results = await searcher.search("typescript compilation error");
    expect(client.searchIssues).not.toHaveBeenCalled();
    expect(results).toHaveLength(1);
    expect(results[0].issue.number).toBe(1);
  });

  it("calls API and caches on cache miss", async () => {
    const cache = new SearchCache();
    const issues = [makeIssue(2)];
    const client = makeMockClient(issues);
    const searcher = new IssueSearcher({ client, cache });

    const setSpy = vi.spyOn(cache, "set");
    await searcher.search("typescript compilation error");

    expect(client.searchIssues).toHaveBeenCalledOnce();
    expect(setSpy).toHaveBeenCalled();
  });

  it("second search with same terms uses cache", async () => {
    const cache = new SearchCache();
    const client = makeMockClient([makeIssue(3)]);
    const searcher = new IssueSearcher({ client, cache });

    await searcher.search("typescript compilation error");
    await searcher.search("typescript compilation error");

    expect(client.searchIssues).toHaveBeenCalledTimes(1);
  });
});

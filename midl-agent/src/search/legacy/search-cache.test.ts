import { describe, it, expect } from "vitest";
import { SearchCache } from "./search-cache.js";
import type { GitHubIssueResult } from "../types/search-types.js";

function makeResult(n: number): GitHubIssueResult {
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

describe("SearchCache", () => {
  it("returns null for cache miss", () => {
    const cache = new SearchCache();
    expect(cache.get(["nonexistent"])).toBeNull();
  });

  it("returns cached results for cache hit", () => {
    const cache = new SearchCache();
    const results = [makeResult(1)];
    cache.set(["error"], results);
    expect(cache.get(["error"])).toEqual(results);
  });

  it("normalizes key order (typescript error == error typescript)", () => {
    const cache = new SearchCache();
    const results = [makeResult(1)];
    cache.set(["typescript", "error"], results);
    expect(cache.get(["error", "typescript"])).toEqual(results);
  });

  it("returns null for expired entries", async () => {
    const cache = new SearchCache({ ttlMs: 50 });
    cache.set(["test"], [makeResult(1)]);
    expect(cache.get(["test"])).not.toBeNull();
    await new Promise((r) => setTimeout(r, 60));
    expect(cache.get(["test"])).toBeNull();
  });

  it("evicts oldest entry when at max capacity", () => {
    const cache = new SearchCache({ maxEntries: 2 });
    cache.set(["first"], [makeResult(1)]);
    cache.set(["second"], [makeResult(2)]);
    cache.set(["third"], [makeResult(3)]);
    expect(cache.get(["first"])).toBeNull();
    expect(cache.get(["second"])).not.toBeNull();
    expect(cache.get(["third"])).not.toBeNull();
    expect(cache.size()).toBe(2);
  });

  it("clear() removes all entries", () => {
    const cache = new SearchCache();
    cache.set(["a"], [makeResult(1)]);
    cache.set(["b"], [makeResult(2)]);
    expect(cache.size()).toBe(2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });
});

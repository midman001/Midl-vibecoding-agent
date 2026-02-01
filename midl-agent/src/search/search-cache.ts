import type { GitHubIssueResult } from "../types/search-types.js";

interface CacheEntry {
  results: GitHubIssueResult[];
  timestamp: number;
}

interface SearchCacheOptions {
  ttlMs?: number;
  maxEntries?: number;
}

export class SearchCache {
  private cache = new Map<string, CacheEntry>();
  private ttlMs: number;
  private maxEntries: number;

  constructor(options?: SearchCacheOptions) {
    this.ttlMs = options?.ttlMs ?? 300_000;
    this.maxEntries = options?.maxEntries ?? 100;
  }

  normalizeKey(terms: string[]): string {
    return terms.map((t) => t.toLowerCase()).sort().join("|");
  }

  get(terms: string[]): GitHubIssueResult[] | null {
    const key = this.normalizeKey(terms);
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp >= this.ttlMs) {
      this.cache.delete(key);
      return null;
    }
    return entry.results;
  }

  set(terms: string[], results: GitHubIssueResult[]): void {
    const key = this.normalizeKey(terms);
    if (this.cache.size >= this.maxEntries && !this.cache.has(key)) {
      // Evict oldest entry by timestamp
      let oldestKey: string | null = null;
      let oldestTime = Infinity;
      for (const [k, v] of this.cache) {
        if (v.timestamp < oldestTime) {
          oldestTime = v.timestamp;
          oldestKey = k;
        }
      }
      if (oldestKey) this.cache.delete(oldestKey);
    }
    this.cache.set(key, { results, timestamp: Date.now() });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Unit tests for ApiKeyStore
 *
 * Tests for API key generation, validation, rate limiting, and revocation.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { ApiKeyStore } from "./api-key-store.js";
import { RATE_LIMIT_POSTS_PER_HOUR, RATE_LIMIT_WINDOW_MS } from "./types.js";

describe("ApiKeyStore", () => {
  let store: ApiKeyStore;

  beforeEach(() => {
    store = new ApiKeyStore();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("createKey", () => {
    it("generates key with midl_ prefix", () => {
      const key = store.createKey("user-123");
      expect(key).toMatch(/^midl_[a-f0-9]{32}$/);
    });

    it("generates unique keys for different users", () => {
      const key1 = store.createKey("user-1");
      const key2 = store.createKey("user-2");
      expect(key1).not.toBe(key2);
    });

    it("replaces existing key when user regenerates", () => {
      const oldKey = store.createKey("user-123");
      const newKey = store.createKey("user-123");

      expect(newKey).not.toBe(oldKey);
      expect(store.validateKey(oldKey)).toBeNull();
      expect(store.validateKey(newKey)).not.toBeNull();
    });

    it("preserves other users keys when regenerating", () => {
      const userAKey = store.createKey("user-a");
      const userBKey = store.createKey("user-b");

      // User A regenerates
      store.createKey("user-a");

      // User B's key should still work
      expect(store.validateKey(userBKey)).not.toBeNull();
    });
  });

  describe("validateKey", () => {
    it("returns record for valid key", () => {
      const key = store.createKey("user-123");
      const record = store.validateKey(key);

      expect(record).not.toBeNull();
      expect(record!.apiKey).toBe(key);
      expect(record!.discordUserId).toBe("user-123");
      expect(record!.postsThisHour).toBe(0);
      expect(record!.lastPostTime).toBeNull();
    });

    it("returns null for invalid key", () => {
      const record = store.validateKey("midl_invalid_key_1234567890ab");
      expect(record).toBeNull();
    });

    it("returns null for revoked key", () => {
      const key = store.createKey("user-123");
      store.revokeKey(key);

      expect(store.validateKey(key)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(store.validateKey("")).toBeNull();
    });
  });

  describe("checkRateLimit", () => {
    it("allows posts under the limit", () => {
      const key = store.createKey("user-123");
      const result = store.checkRateLimit(key);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMIT_POSTS_PER_HOUR);
      expect(result.resetInSeconds).toBe(0);
    });

    it("blocks posts after reaching limit", () => {
      const key = store.createKey("user-123");

      // Make posts up to the limit
      for (let i = 0; i < RATE_LIMIT_POSTS_PER_HOUR; i++) {
        store.recordPost(key);
      }

      const result = store.checkRateLimit(key);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetInSeconds).toBeGreaterThan(0);
    });

    it("decrements remaining count after each post", () => {
      const key = store.createKey("user-123");

      store.recordPost(key);
      let result = store.checkRateLimit(key);
      expect(result.remaining).toBe(RATE_LIMIT_POSTS_PER_HOUR - 1);

      store.recordPost(key);
      result = store.checkRateLimit(key);
      expect(result.remaining).toBe(RATE_LIMIT_POSTS_PER_HOUR - 2);
    });

    it("resets counter after rate limit window expires", () => {
      const key = store.createKey("user-123");

      // Use all posts
      for (let i = 0; i < RATE_LIMIT_POSTS_PER_HOUR; i++) {
        store.recordPost(key);
      }

      // Verify blocked
      expect(store.checkRateLimit(key).allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

      // Should be allowed again
      const result = store.checkRateLimit(key);
      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(RATE_LIMIT_POSTS_PER_HOUR);
    });

    it("returns not allowed for invalid key", () => {
      const result = store.checkRateLimit("invalid-key");

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
      expect(result.resetInSeconds).toBe(0);
    });

    it("calculates correct reset time when at limit", () => {
      const key = store.createKey("user-123");
      const startTime = Date.now();

      for (let i = 0; i < RATE_LIMIT_POSTS_PER_HOUR; i++) {
        store.recordPost(key);
      }

      // Advance 10 minutes
      vi.advanceTimersByTime(10 * 60 * 1000);

      const result = store.checkRateLimit(key);
      const expectedSeconds = Math.ceil(
        (RATE_LIMIT_WINDOW_MS - 10 * 60 * 1000) / 1000
      );

      expect(result.resetInSeconds).toBeGreaterThanOrEqual(expectedSeconds - 1);
      expect(result.resetInSeconds).toBeLessThanOrEqual(expectedSeconds + 1);
    });
  });

  describe("getKeyForUser", () => {
    it("returns existing key for user", () => {
      const key = store.createKey("user-123");
      expect(store.getKeyForUser("user-123")).toBe(key);
    });

    it("returns null for user without key", () => {
      expect(store.getKeyForUser("unknown-user")).toBeNull();
    });

    it("returns new key after regeneration", () => {
      const oldKey = store.createKey("user-123");
      const newKey = store.createKey("user-123");

      expect(store.getKeyForUser("user-123")).toBe(newKey);
      expect(store.getKeyForUser("user-123")).not.toBe(oldKey);
    });
  });

  describe("revokeKey", () => {
    it("removes key from store", () => {
      const key = store.createKey("user-123");
      expect(store.revokeKey(key)).toBe(true);
      expect(store.validateKey(key)).toBeNull();
    });

    it("returns false for unknown key", () => {
      expect(store.revokeKey("unknown-key")).toBe(false);
    });

    it("clears user lookup after revocation", () => {
      const key = store.createKey("user-123");
      store.revokeKey(key);

      expect(store.getKeyForUser("user-123")).toBeNull();
    });

    it("allows creating new key after revocation", () => {
      const oldKey = store.createKey("user-123");
      store.revokeKey(oldKey);

      const newKey = store.createKey("user-123");
      expect(store.validateKey(newKey)).not.toBeNull();
    });
  });

  describe("recordPost", () => {
    it("increments posts count", () => {
      const key = store.createKey("user-123");

      store.recordPost(key);
      const record = store.validateKey(key);
      expect(record!.postsThisHour).toBe(1);

      store.recordPost(key);
      expect(store.validateKey(key)!.postsThisHour).toBe(2);
    });

    it("updates last post time", () => {
      const key = store.createKey("user-123");
      const beforePost = Date.now();

      store.recordPost(key);
      const record = store.validateKey(key);

      expect(record!.lastPostTime).not.toBeNull();
      expect(record!.lastPostTime!.getTime()).toBeGreaterThanOrEqual(beforePost);
    });

    it("does nothing for invalid key", () => {
      // Should not throw
      expect(() => store.recordPost("invalid-key")).not.toThrow();
    });

    it("resets counter when recording after window expires", () => {
      const key = store.createKey("user-123");

      // Make some posts
      store.recordPost(key);
      store.recordPost(key);
      expect(store.validateKey(key)!.postsThisHour).toBe(2);

      // Advance time past the window
      vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

      // Next post should reset the counter
      store.recordPost(key);
      expect(store.validateKey(key)!.postsThisHour).toBe(1);
    });
  });
});

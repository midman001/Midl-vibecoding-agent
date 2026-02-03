/**
 * API Key Store for MCP Server Authentication
 *
 * In-memory storage for API keys with rate limiting.
 * Keys are generated via Discord /setup-mcp command and tied to Discord user IDs.
 */

import * as crypto from "node:crypto";
import {
  ApiKeyRecord,
  RateLimitResult,
  RATE_LIMIT_POSTS_PER_HOUR,
  RATE_LIMIT_WINDOW_MS,
} from "./types.js";

export class ApiKeyStore {
  /** Map of apiKey -> ApiKeyRecord */
  private store = new Map<string, ApiKeyRecord>();

  /** Map of discordUserId -> apiKey (for lookup by user) */
  private userKeyMap = new Map<string, string>();

  /**
   * Create a new API key for a Discord user.
   * If the user already has a key, the old one is revoked first.
   */
  createKey(discordUserId: string): string {
    // If user already has a key, revoke old one first
    const existingKey = this.userKeyMap.get(discordUserId);
    if (existingKey) {
      this.revokeKey(existingKey);
    }

    // Generate API key: midl_ + 32 random hex chars
    const randomBytes = crypto.randomBytes(16);
    const apiKey = `midl_${randomBytes.toString("hex")}`;

    // Create record
    const record: ApiKeyRecord = {
      apiKey,
      discordUserId,
      createdAt: new Date(),
      postsThisHour: 0,
      lastPostTime: null,
    };

    // Store in both maps
    this.store.set(apiKey, record);
    this.userKeyMap.set(discordUserId, apiKey);

    return apiKey;
  }

  /**
   * Validate an API key and return its record.
   * Returns null if the key doesn't exist.
   */
  validateKey(apiKey: string): ApiKeyRecord | null {
    return this.store.get(apiKey) ?? null;
  }

  /**
   * Get the existing API key for a Discord user.
   * Returns null if the user doesn't have a key.
   */
  getKeyForUser(discordUserId: string): string | null {
    return this.userKeyMap.get(discordUserId) ?? null;
  }

  /**
   * Revoke an API key.
   * Returns true if the key existed and was revoked.
   */
  revokeKey(apiKey: string): boolean {
    const record = this.store.get(apiKey);
    if (!record) {
      return false;
    }

    // Remove from both maps
    this.store.delete(apiKey);
    this.userKeyMap.delete(record.discordUserId);
    return true;
  }

  /**
   * Check if a post is allowed under the rate limit.
   * Does NOT record the post - call recordPost() after successful posting.
   */
  checkRateLimit(apiKey: string): RateLimitResult {
    const record = this.store.get(apiKey);
    if (!record) {
      return { allowed: false, remaining: 0, resetInSeconds: 0 };
    }

    const now = Date.now();

    // If lastPostTime is older than the rate limit window, reset counter
    if (
      record.lastPostTime &&
      now - record.lastPostTime.getTime() >= RATE_LIMIT_WINDOW_MS
    ) {
      record.postsThisHour = 0;
    }

    // Check if rate limit is exceeded
    if (record.postsThisHour >= RATE_LIMIT_POSTS_PER_HOUR) {
      // Calculate time until reset
      const resetTime = record.lastPostTime
        ? record.lastPostTime.getTime() + RATE_LIMIT_WINDOW_MS
        : now + RATE_LIMIT_WINDOW_MS;
      const resetInSeconds = Math.ceil((resetTime - now) / 1000);

      return {
        allowed: false,
        remaining: 0,
        resetInSeconds: Math.max(0, resetInSeconds),
      };
    }

    return {
      allowed: true,
      remaining: RATE_LIMIT_POSTS_PER_HOUR - record.postsThisHour,
      resetInSeconds: 0,
    };
  }

  /**
   * Record a post for rate limiting purposes.
   * Call this after a successful post.
   */
  recordPost(apiKey: string): void {
    const record = this.store.get(apiKey);
    if (!record) {
      return;
    }

    const now = new Date();

    // If this is the first post after a window reset, reset the counter
    if (
      record.lastPostTime &&
      now.getTime() - record.lastPostTime.getTime() >= RATE_LIMIT_WINDOW_MS
    ) {
      record.postsThisHour = 0;
    }

    record.postsThisHour++;
    record.lastPostTime = now;
  }
}

/** Singleton instance shared between Discord bot and MCP server */
export const apiKeyStore = new ApiKeyStore();

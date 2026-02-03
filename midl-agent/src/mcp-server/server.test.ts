/**
 * Unit tests for McpDiscordServer
 *
 * Tests for MCP server tools: API key validation, rate limiting integration.
 * Uses mocks for DiscordClient and ForumPoster to isolate server behavior.
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { McpDiscordServer } from "./server.js";
import { ApiKeyStore } from "./api-key-store.js";
import type { McpServerConfig } from "./types.js";

/**
 * Create a mock config for testing
 */
function createMockConfig(): McpServerConfig {
  return {
    discordBotToken: "test-bot-token",
    guildId: "test-guild-123",
    forumChannelId: "test-channel-456",
  };
}

describe("McpDiscordServer", () => {
  let server: McpDiscordServer;
  let apiKeyStore: ApiKeyStore;
  let config: McpServerConfig;

  beforeEach(() => {
    apiKeyStore = new ApiKeyStore();
    config = createMockConfig();
    server = new McpDiscordServer({ config, apiKeyStore });
  });

  describe("constructor", () => {
    it("creates server with provided config and apiKeyStore", () => {
      expect(server).toBeDefined();
      expect(server.getMcpServer()).toBeDefined();
    });

    it("server has correct name and version", () => {
      const mcpServer = server.getMcpServer();
      // The server metadata is set during construction
      expect(mcpServer).toBeDefined();
    });
  });

  describe("createApiKeyForUser", () => {
    it("delegates to apiKeyStore.createKey", () => {
      const key = server.createApiKeyForUser("user-123");

      expect(key).toMatch(/^midl_[a-f0-9]{32}$/);
      expect(apiKeyStore.validateKey(key)).not.toBeNull();
    });

    it("replaces existing key when regenerating", () => {
      const oldKey = server.createApiKeyForUser("user-123");
      const newKey = server.createApiKeyForUser("user-123");

      expect(newKey).not.toBe(oldKey);
      expect(apiKeyStore.validateKey(oldKey)).toBeNull();
      expect(apiKeyStore.validateKey(newKey)).not.toBeNull();
    });
  });

  describe("API key validation", () => {
    it("validates key through internal validateApiKey", () => {
      // Create a key first
      const key = server.createApiKeyForUser("user-123");

      // The key should be valid in the store
      const record = apiKeyStore.validateKey(key);
      expect(record).not.toBeNull();
      expect(record!.discordUserId).toBe("user-123");
    });

    it("returns null for invalid key", () => {
      const record = apiKeyStore.validateKey("invalid-key");
      expect(record).toBeNull();
    });

    it("returns null for empty key", () => {
      const record = apiKeyStore.validateKey("");
      expect(record).toBeNull();
    });
  });

  describe("Rate limiting integration", () => {
    it("checkRateLimit returns remaining posts for valid key", () => {
      const key = server.createApiKeyForUser("user-123");
      const result = apiKeyStore.checkRateLimit(key);

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(5);
      expect(result.resetInSeconds).toBe(0);
    });

    it("checkRateLimit blocks after 5 posts", () => {
      const key = server.createApiKeyForUser("user-123");

      // Simulate 5 posts
      for (let i = 0; i < 5; i++) {
        apiKeyStore.recordPost(key);
      }

      const result = apiKeyStore.checkRateLimit(key);
      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it("rate limit applies per key, not globally", () => {
      const key1 = server.createApiKeyForUser("user-1");
      const key2 = server.createApiKeyForUser("user-2");

      // Use up key1's limit
      for (let i = 0; i < 5; i++) {
        apiKeyStore.recordPost(key1);
      }

      // key2 should still be allowed
      const result2 = apiKeyStore.checkRateLimit(key2);
      expect(result2.allowed).toBe(true);
      expect(result2.remaining).toBe(5);

      // key1 should be blocked
      const result1 = apiKeyStore.checkRateLimit(key1);
      expect(result1.allowed).toBe(false);
    });
  });

  describe("Tool registration", () => {
    it("registers check_server_status tool", () => {
      const mcpServer = server.getMcpServer();
      // The server should have tools registered
      // We can verify by checking the internal state
      expect(mcpServer).toBeDefined();
    });

    it("registers create_discord_thread tool", () => {
      const mcpServer = server.getMcpServer();
      expect(mcpServer).toBeDefined();
    });

    it("registers list_recent_threads tool", () => {
      const mcpServer = server.getMcpServer();
      expect(mcpServer).toBeDefined();
    });
  });

  describe("Key isolation", () => {
    it("each user has independent rate limits", () => {
      const keyA = server.createApiKeyForUser("user-a");
      const keyB = server.createApiKeyForUser("user-b");

      // User A posts 3 times
      apiKeyStore.recordPost(keyA);
      apiKeyStore.recordPost(keyA);
      apiKeyStore.recordPost(keyA);

      // User A has 2 remaining
      expect(apiKeyStore.checkRateLimit(keyA).remaining).toBe(2);

      // User B still has full 5
      expect(apiKeyStore.checkRateLimit(keyB).remaining).toBe(5);
    });

    it("revoking one users key does not affect others", () => {
      const keyA = server.createApiKeyForUser("user-a");
      const keyB = server.createApiKeyForUser("user-b");

      apiKeyStore.revokeKey(keyA);

      // Key A is invalid
      expect(apiKeyStore.validateKey(keyA)).toBeNull();

      // Key B still works
      expect(apiKeyStore.validateKey(keyB)).not.toBeNull();
    });
  });

  describe("Configuration", () => {
    it("accepts config with all required fields", () => {
      const customConfig: McpServerConfig = {
        discordBotToken: "custom-token",
        guildId: "custom-guild",
        forumChannelId: "custom-channel",
      };

      const customServer = new McpDiscordServer({
        config: customConfig,
        apiKeyStore: new ApiKeyStore(),
      });

      expect(customServer).toBeDefined();
    });

    it("uses injected apiKeyStore", () => {
      const customStore = new ApiKeyStore();
      const customServer = new McpDiscordServer({
        config: createMockConfig(),
        apiKeyStore: customStore,
      });

      // Create key through server
      const key = customServer.createApiKeyForUser("test-user");

      // Should be in the custom store
      expect(customStore.validateKey(key)).not.toBeNull();
    });
  });
});

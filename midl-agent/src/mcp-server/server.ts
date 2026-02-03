/**
 * MCP Discord Server
 *
 * MCP server that enables Claude agents to post diagnostic reports
 * to Discord without exposing bot credentials.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { DiscordClient } from "../discord/discord-client.js";
import {
  McpServerConfig,
  ApiKeyRecord,
  RATE_LIMIT_POSTS_PER_HOUR,
  RATE_LIMIT_WINDOW_MS,
} from "./types.js";

export interface McpDiscordServerDeps {
  config: McpServerConfig;
  apiKeyStore?: Map<string, ApiKeyRecord>;
}

export class McpDiscordServer {
  private mcpServer: McpServer;
  private discordClient: DiscordClient | null = null;
  private config: McpServerConfig;
  private apiKeyStore: Map<string, ApiKeyRecord>;

  constructor(deps: McpDiscordServerDeps) {
    this.config = deps.config;
    this.apiKeyStore = deps.apiKeyStore ?? new Map();

    this.mcpServer = new McpServer({
      name: "midl-discord-poster",
      version: "1.0.0",
    });

    this.registerTools();
  }

  /**
   * Validate an API key and return the associated record if valid
   */
  private validateApiKey(apiKey: string): ApiKeyRecord | null {
    return this.apiKeyStore.get(apiKey) ?? null;
  }

  /**
   * Check rate limit for an API key record
   */
  private checkRateLimit(record: ApiKeyRecord): {
    allowed: boolean;
    remaining: number;
    resetInSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // Reset counter if window has passed
    if (record.lastPostTime && record.lastPostTime.getTime() < windowStart) {
      record.postsThisHour = 0;
    }

    const remaining = RATE_LIMIT_POSTS_PER_HOUR - record.postsThisHour;
    const resetInSeconds = record.lastPostTime
      ? Math.max(0, Math.ceil((record.lastPostTime.getTime() + RATE_LIMIT_WINDOW_MS - now) / 1000))
      : 0;

    return {
      allowed: record.postsThisHour < RATE_LIMIT_POSTS_PER_HOUR,
      remaining: Math.max(0, remaining),
      resetInSeconds,
    };
  }

  /**
   * Ensure Discord client is connected
   */
  private async ensureDiscordConnection(): Promise<void> {
    if (!this.discordClient) {
      this.discordClient = new DiscordClient({
        config: {
          botToken: this.config.discordBotToken,
          guildId: this.config.guildId,
          forumChannelId: this.config.forumChannelId,
        },
      });
    }

    if (!this.discordClient.isConnected) {
      await this.discordClient.connect();
    }
  }

  /**
   * Register all MCP tools
   */
  private registerTools(): void {
    // check_server_status tool
    this.mcpServer.tool(
      "check_server_status",
      "Check Discord bot connectivity and server status",
      {
        apiKey: z.string().describe("Your MCP API key from /setup-mcp command"),
      },
      async ({ apiKey }) => {
        // Validate API key
        const record = this.validateApiKey(apiKey);
        if (!record) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  connected: false,
                  error: "Invalid API key. Run /setup-mcp in Discord to get your key.",
                }),
              },
            ],
          };
        }

        // Check rate limit
        const rateLimit = this.checkRateLimit(record);

        try {
          // Connect to Discord
          await this.ensureDiscordConnection();

          // Get guild and channel info
          const guild = await this.discordClient!.getGuild();
          const forumChannel = await this.discordClient!.getForumChannel();

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  connected: true,
                  guildName: guild.name,
                  forumChannelName: forumChannel.name,
                  rateLimit: {
                    remaining: rateLimit.remaining,
                    resetInSeconds: rateLimit.resetInSeconds,
                  },
                }),
              },
            ],
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  connected: false,
                  error: `Discord connection failed: ${errorMessage}`,
                }),
              },
            ],
          };
        }
      }
    );
  }

  /**
   * Start the MCP server on stdio transport
   */
  async start(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.mcpServer.connect(transport);
    console.error("MIDL MCP Server running on stdio");
  }

  /**
   * Get the underlying MCP server instance (for testing)
   */
  getMcpServer(): McpServer {
    return this.mcpServer;
  }

  /**
   * Add an API key to the store (for testing or admin use)
   */
  addApiKey(record: ApiKeyRecord): void {
    this.apiKeyStore.set(record.apiKey, record);
  }
}

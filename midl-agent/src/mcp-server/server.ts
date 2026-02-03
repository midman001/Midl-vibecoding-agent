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
import { ForumPoster } from "../discord/forum-poster.js";
import { McpServerConfig } from "./types.js";
import { ApiKeyStore, apiKeyStore as defaultApiKeyStore } from "./api-key-store.js";
import { threadTracker } from "./thread-tracker.js";

export interface McpDiscordServerDeps {
  config: McpServerConfig;
  apiKeyStore?: ApiKeyStore;
}

export class McpDiscordServer {
  private mcpServer: McpServer;
  private discordClient: DiscordClient | null = null;
  private forumPoster: ForumPoster | null = null;
  private config: McpServerConfig;
  private apiKeyStore: ApiKeyStore;

  constructor(deps: McpDiscordServerDeps) {
    this.config = deps.config;
    this.apiKeyStore = deps.apiKeyStore ?? defaultApiKeyStore;

    this.mcpServer = new McpServer({
      name: "midl-discord-poster",
      version: "1.0.0",
    });

    this.registerTools();
  }

  /**
   * Validate an API key and return the associated record if valid
   */
  private validateApiKey(apiKey: string) {
    return this.apiKeyStore.validateKey(apiKey);
  }

  /**
   * Check rate limit for an API key
   */
  private checkRateLimit(apiKey: string) {
    return this.apiKeyStore.checkRateLimit(apiKey);
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
        const rateLimit = this.checkRateLimit(apiKey);

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

    // create_discord_thread tool
    this.mcpServer.tool(
      "create_discord_thread",
      "Post a diagnostic report to the Discord forum as a new thread",
      {
        apiKey: z.string().describe("Your MCP API key from /setup-mcp command"),
        reportMarkdown: z.string().describe("The diagnostic report content in markdown format"),
        title: z.string().max(100).describe("Thread title (max 100 chars)"),
        summary: z.string().describe("Brief summary of the issue"),
        authorName: z.string().optional().describe("Name to display as report author"),
      },
      async ({ apiKey, reportMarkdown, title, summary, authorName }) => {
        // Validate API key
        const record = this.validateApiKey(apiKey);
        if (!record) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: "Invalid API key. Run /setup-mcp in Discord to get your key.",
                }),
              },
            ],
          };
        }

        // Check rate limit
        const rateLimit = this.checkRateLimit(apiKey);
        if (!rateLimit.allowed) {
          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: false,
                  error: `Rate limit exceeded. ${rateLimit.remaining} posts remaining. Resets in ${rateLimit.resetInSeconds}s`,
                }),
              },
            ],
          };
        }

        try {
          // Ensure Discord is connected
          await this.ensureDiscordConnection();

          // Initialize ForumPoster if not done
          if (!this.forumPoster) {
            this.forumPoster = new ForumPoster(this.discordClient!);
          }

          // Generate filename from title
          const sanitizedTitle = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, "")
            .slice(0, 50);
          const timestamp = new Date().toISOString().split("T")[0];
          const reportFilename = `diagnostic-${sanitizedTitle}-${timestamp}.md`;

          // Post to Discord
          const result = await this.forumPoster.postReport({
            title,
            summary,
            reportMarkdown,
            reportFilename,
            authorName,
          });

          // Record the post for rate limiting
          this.apiKeyStore.recordPost(apiKey);

          // Track thread for list_recent_threads
          threadTracker.recordThread({
            threadId: result.threadId,
            threadUrl: result.threadUrl,
            title,
            apiKey,
          });

          return {
            content: [
              {
                type: "text" as const,
                text: JSON.stringify({
                  success: true,
                  url: result.threadUrl,
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
                  success: false,
                  error: errorMessage,
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
   * Create an API key for a Discord user (for testing or admin use)
   * Returns the generated API key
   */
  createApiKeyForUser(discordUserId: string): string {
    return this.apiKeyStore.createKey(discordUserId);
  }
}

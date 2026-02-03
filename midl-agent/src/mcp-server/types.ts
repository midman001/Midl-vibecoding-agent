/**
 * MCP Server Types for Discord Posting
 *
 * Type definitions for the MCP server that enables Claude agents
 * to post diagnostic reports to Discord without credential exposure.
 */

// Rate limiting constants
export const RATE_LIMIT_POSTS_PER_HOUR = 5;
export const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour in milliseconds

/**
 * Configuration for the MCP server
 */
export interface McpServerConfig {
  discordBotToken: string;
  guildId: string;
  forumChannelId: string;
}

/**
 * API key record for authentication and rate limiting
 */
export interface ApiKeyRecord {
  apiKey: string;
  discordUserId: string;
  createdAt: Date;
  postsThisHour: number;
  lastPostTime: Date | null;
}

/**
 * Input for creating a Discord forum thread
 */
export interface CreateThreadInput {
  reportMarkdown: string;
  title: string;
  summary: string;
  authorName?: string;
}

/**
 * Result from creating a Discord thread
 */
export interface CreateThreadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetInSeconds: number;
}

/**
 * Load MCP server configuration from environment variables.
 * Throws if required variables are missing.
 */
export function loadMcpServerConfig(): McpServerConfig {
  const discordBotToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const forumChannelId = process.env.DISCORD_FORUM_CHANNEL_ID;

  const missing: string[] = [];
  if (!discordBotToken) missing.push("DISCORD_BOT_TOKEN");
  if (!guildId) missing.push("DISCORD_GUILD_ID");
  if (!forumChannelId) missing.push("DISCORD_FORUM_CHANNEL_ID");

  if (missing.length > 0) {
    throw new Error(
      `Missing required MCP server environment variables: ${missing.join(", ")}. ` +
        `Set them in your .env file or environment.`
    );
  }

  return {
    discordBotToken: discordBotToken!,
    guildId: guildId!,
    forumChannelId: forumChannelId!,
  };
}

/**
 * Configuration for HTTP MCP server
 */
export interface HttpMcpServerConfig extends McpServerConfig {
  port: number;
  host: string;
  allowedOrigins: string[]; // For origin validation
  connectionTimeoutMs: number;
}

/**
 * Load HTTP MCP server configuration from environment variables.
 * Extends loadMcpServerConfig with HTTP-specific settings.
 */
export function loadHttpMcpServerConfig(): HttpMcpServerConfig {
  const baseConfig = loadMcpServerConfig();

  const port = parseInt(process.env.MCP_SERVER_PORT || "3847", 10);
  const host = process.env.MCP_SERVER_HOST || "0.0.0.0";
  const allowedOrigins = process.env.MCP_ALLOWED_ORIGINS
    ? process.env.MCP_ALLOWED_ORIGINS.split(",").map((o) => o.trim())
    : []; // Empty array = allow all origins (for local dev)
  const connectionTimeoutMs = parseInt(
    process.env.MCP_CONNECTION_TIMEOUT_MS || "30000",
    10
  );

  return {
    ...baseConfig,
    port,
    host,
    allowedOrigins,
    connectionTimeoutMs,
  };
}

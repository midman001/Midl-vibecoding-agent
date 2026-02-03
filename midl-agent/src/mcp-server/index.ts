/**
 * MCP Server for Discord Posting
 *
 * Entry point and barrel export for the MCP server module.
 */

import "dotenv/config";

export { McpDiscordServer } from "./server.js";
export type { McpDiscordServerDeps } from "./server.js";
export { ApiKeyStore, apiKeyStore } from "./api-key-store.js";
export { ThreadTracker, threadTracker } from "./thread-tracker.js";
export type { ThreadRecord } from "./thread-tracker.js";
export type {
  McpServerConfig,
  ApiKeyRecord,
  CreateThreadInput,
  CreateThreadResult,
  RateLimitResult,
} from "./types.js";
export {
  loadMcpServerConfig,
  RATE_LIMIT_POSTS_PER_HOUR,
  RATE_LIMIT_WINDOW_MS,
} from "./types.js";

import { McpDiscordServer } from "./server.js";
import { loadMcpServerConfig } from "./types.js";

/**
 * Start the MCP server with configuration from environment variables.
 * This is the main entry point for running the server.
 */
export async function startMcpServer(): Promise<void> {
  const config = loadMcpServerConfig();
  const server = new McpDiscordServer({ config });
  await server.start();
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  startMcpServer().catch((error) => {
    console.error("Failed to start MCP server:", error);
    process.exit(1);
  });
}

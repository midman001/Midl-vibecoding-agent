/**
 * MCP Server for Discord Posting
 *
 * Entry point and barrel export for the MCP server module.
 * Supports both stdio (legacy) and HTTP transport modes.
 */

import "dotenv/config";

export { McpDiscordServer } from "./server.js";
export type { McpDiscordServerDeps } from "./server.js";
export { ApiKeyStore, apiKeyStore } from "./api-key-store.js";
export { ThreadTracker, threadTracker } from "./thread-tracker.js";
export type { ThreadRecord } from "./thread-tracker.js";
export type {
  McpServerConfig,
  HttpMcpServerConfig,
  ApiKeyRecord,
  CreateThreadInput,
  CreateThreadResult,
  RateLimitResult,
} from "./types.js";
export {
  loadMcpServerConfig,
  loadHttpMcpServerConfig,
  RATE_LIMIT_POSTS_PER_HOUR,
  RATE_LIMIT_WINDOW_MS,
} from "./types.js";
export { HttpMcpServer, createHttpServer } from "./http-server.js";
export {
  createAuthMiddleware,
  createOriginValidationMiddleware,
} from "./middleware/index.js";

import { McpDiscordServer } from "./server.js";
import { HttpMcpServer } from "./http-server.js";
import { loadMcpServerConfig, loadHttpMcpServerConfig } from "./types.js";

/**
 * Start the MCP server on stdio transport (legacy mode).
 * This is the original entry point for local development.
 */
export async function startMcpServer(): Promise<void> {
  const config = loadMcpServerConfig();
  const server = new McpDiscordServer({ config });
  await server.start();
}

/**
 * Start the MCP server on HTTP transport.
 * This is the new entry point for cloud deployment.
 */
export async function startHttpMcpServer(): Promise<HttpMcpServer> {
  const config = loadHttpMcpServerConfig();
  const mcpDiscordServer = new McpDiscordServer({ config });
  const httpServer = new HttpMcpServer({
    config,
    mcpServer: mcpDiscordServer.getMcpServer(),
  });
  await httpServer.start();
  return httpServer;
}

// Run based on transport mode
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const useHttp = process.env.MCP_TRANSPORT === "http";

  if (useHttp) {
    startHttpMcpServer().catch((error) => {
      console.error("Failed to start HTTP MCP server:", error);
      process.exit(1);
    });
  } else {
    startMcpServer().catch((error) => {
      console.error("Failed to start MCP server:", error);
      process.exit(1);
    });
  }
}

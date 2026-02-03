/**
 * Combined Entry Point for Render Deployment
 *
 * Starts both Discord bot and HTTP MCP server in a single process.
 * This is required because:
 * 1. Render requires a single process per service
 * 2. Bot and MCP server must share the ApiKeyStore singleton
 *    (keys created via /setup-mcp must work for MCP auth)
 */

import "dotenv/config";
import { startBot } from "./discord/bot.js";
import { startHttpMcpServer } from "./mcp-server/index.js";

// Bridge PORT environment variable for Render compatibility
// Render sets PORT, but our HTTP server reads MCP_SERVER_PORT
// This MUST happen before startHttpMcpServer() is called
process.env.MCP_SERVER_PORT =
  process.env.PORT || process.env.MCP_SERVER_PORT || "3847";

console.log("HTTP server will bind to port:", process.env.MCP_SERVER_PORT);

/**
 * Start both services in a single process.
 * Both services share the ApiKeyStore singleton automatically.
 *
 * @returns Object containing cleanup function and server instance
 */
export async function startCombinedServer(): Promise<{
  cleanup: () => Promise<void>;
  httpServer: Awaited<ReturnType<typeof startHttpMcpServer>>;
}> {
  // Start Discord bot first (returns cleanup function)
  const cleanup = await startBot();
  console.log("Discord bot started successfully");

  // Start HTTP MCP server second (returns HttpMcpServer instance)
  const httpServer = await startHttpMcpServer();
  console.log("HTTP MCP server started successfully");

  // Both services share the apiKeyStore singleton from api-key-store.ts
  // No need to pass it explicitly - they import the same singleton

  console.log("Combined server ready - Discord bot + HTTP MCP server running");

  return { cleanup, httpServer };
}

// Direct run detection
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  startCombinedServer().catch((err) => {
    console.error("Failed to start combined server:", err);
    process.exit(1);
  });
}

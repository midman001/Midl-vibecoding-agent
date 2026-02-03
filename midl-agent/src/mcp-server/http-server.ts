/**
 * HTTP MCP Server
 *
 * Express server wrapping MCP server with StreamableHTTPServerTransport.
 * Provides authenticated HTTP endpoint for MCP protocol requests.
 */
import express, { type Application, type Request, type Response } from "express";
import { randomUUID } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  createAuthMiddleware,
  createOriginValidationMiddleware,
} from "./middleware/index.js";
import { apiKeyStore as defaultApiKeyStore, ApiKeyStore } from "./api-key-store.js";
import type { HttpMcpServerConfig } from "./types.js";

export interface HttpMcpServerDeps {
  config: HttpMcpServerConfig;
  mcpServer: McpServer;
  apiKeyStore?: ApiKeyStore;
}

/**
 * Creates and configures the Express HTTP server for MCP.
 */
export function createHttpServer(deps: HttpMcpServerDeps): Application {
  const { config, mcpServer, apiKeyStore = defaultApiKeyStore } = deps;

  const app = express();

  // Parse JSON bodies for MCP requests
  app.use(express.json());

  // Health check endpoint (unauthenticated)
  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  });

  // Origin validation middleware (before auth)
  app.use(
    "/mcp",
    createOriginValidationMiddleware({
      allowedOrigins: config.allowedOrigins,
    })
  );

  // Authentication middleware for MCP endpoint
  app.use(
    "/mcp",
    createAuthMiddleware({
      apiKeyStore,
    })
  );

  // MCP endpoint - handles JSON-RPC requests
  // Map to store transports by session ID
  const transports = new Map<string, StreamableHTTPServerTransport>();

  app.post("/mcp", async (req: Request, res: Response) => {
    try {
      // Get or create session ID from header
      let sessionId = req.headers["mcp-session-id"] as string | undefined;

      let transport = sessionId ? transports.get(sessionId) : undefined;

      if (!transport) {
        // Create new transport for this session
        sessionId = randomUUID();
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => sessionId!,
        });

        // Store transport
        transports.set(sessionId, transport);

        // Connect MCP server to transport
        await mcpServer.connect(transport);

        // Clean up on close
        transport.onclose = () => {
          transports.delete(sessionId!);
        };
      }

      // Set session ID header in response
      res.setHeader("mcp-session-id", sessionId!);

      // Handle the request
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("MCP request error:", errorMessage);

      // Only send error if response not already sent
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: `Internal error: ${errorMessage}`,
          },
          id: null,
        });
      }
    }
  });

  // Handle unsupported methods
  app.all("/mcp", (_req: Request, res: Response) => {
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32601,
        message: "Method not allowed. Use POST for MCP requests.",
      },
      id: null,
    });
  });

  return app;
}

/**
 * HTTP MCP Server class for managing the server lifecycle.
 */
export class HttpMcpServer {
  private app: Application;
  private server: ReturnType<Application["listen"]> | null = null;
  private config: HttpMcpServerConfig;

  constructor(deps: HttpMcpServerDeps) {
    this.config = deps.config;
    this.app = createHttpServer(deps);
  }

  /**
   * Start the HTTP server.
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.config.port, this.config.host, () => {
          console.log(
            `MIDL MCP HTTP Server running at http://${this.config.host}:${this.config.port}`
          );
          console.log(`  Health check: http://${this.config.host}:${this.config.port}/health`);
          console.log(`  MCP endpoint: http://${this.config.host}:${this.config.port}/mcp`);
          resolve();
        });

        // Set connection timeout
        this.server.setTimeout(this.config.connectionTimeoutMs);

        this.server.on("error", (err) => {
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Stop the HTTP server gracefully.
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Get the Express app (for testing).
   */
  getApp(): Application {
    return this.app;
  }
}

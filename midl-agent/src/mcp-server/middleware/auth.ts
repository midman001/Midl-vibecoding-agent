/**
 * Bearer token authentication middleware for HTTP MCP server.
 * Validates API keys from Authorization header against ApiKeyStore.
 */
import type { Request, Response, NextFunction } from "express";
import type { ApiKeyStore } from "../api-key-store.js";

export interface AuthMiddlewareDeps {
  apiKeyStore: ApiKeyStore;
}

/**
 * Creates authentication middleware that validates Bearer tokens.
 *
 * @param deps - Dependencies including ApiKeyStore
 * @returns Express middleware function
 *
 * Expected header format: "Authorization: Bearer midl_xxxxxxxx"
 *
 * Responds with 401 if:
 * - Authorization header missing
 * - Not "Bearer" scheme
 * - API key invalid (not in store)
 */
export function createAuthMiddleware(deps: AuthMiddlewareDeps) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authorization header required",
        },
        id: null,
      });
      return;
    }

    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Invalid authorization format. Expected: Bearer <api_key>",
        },
        id: null,
      });
      return;
    }

    const apiKey = parts[1];
    const record = deps.apiKeyStore.validateKey(apiKey);

    if (!record) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message:
            "Invalid API key. Run /setup-mcp in Discord to get your key.",
        },
        id: null,
      });
      return;
    }

    // Attach validated record to request for downstream use
    (req as Request & { apiKeyRecord: typeof record }).apiKeyRecord = record;

    next();
  };
}

/**
 * Origin header validation middleware for DNS rebinding protection.
 *
 * Validates that requests come from allowed origins to prevent
 * DNS rebinding attacks (PITFALL #1 from research).
 */
import type { Request, Response, NextFunction } from "express";

export interface OriginValidationConfig {
  allowedOrigins: string[];
}

/**
 * Creates origin validation middleware.
 *
 * @param config - Configuration with allowed origins list
 * @returns Express middleware function
 *
 * Behavior:
 * - If allowedOrigins is empty, allows all origins (local dev mode)
 * - If request has Origin header, validates against allowedOrigins
 * - Requests without Origin header are allowed (direct API calls)
 * - Responds with 403 if origin not in allowed list
 */
export function createOriginValidationMiddleware(
  config: OriginValidationConfig
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Skip validation if no allowed origins configured (local dev)
    if (config.allowedOrigins.length === 0) {
      next();
      return;
    }

    const origin = req.headers.origin;

    // Allow requests without Origin header (direct API calls, not browser)
    if (!origin) {
      next();
      return;
    }

    // Check if origin is in allowed list
    if (!config.allowedOrigins.includes(origin)) {
      res.status(403).json({
        jsonrpc: "2.0",
        error: {
          code: -32002,
          message: `Origin not allowed: ${origin}`,
        },
        id: null,
      });
      return;
    }

    next();
  };
}

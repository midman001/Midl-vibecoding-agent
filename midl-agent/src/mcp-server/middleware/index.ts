/**
 * HTTP middleware exports for MCP server
 */
export { createAuthMiddleware } from "./auth.js";
export type { AuthMiddlewareDeps } from "./auth.js";
export { createOriginValidationMiddleware } from "./origin-validation.js";
export type { OriginValidationConfig } from "./origin-validation.js";

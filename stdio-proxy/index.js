#!/usr/bin/env node
/**
 * MIDL MCP Stdio Proxy
 *
 * Local stdio server that proxies requests to the remote MIDL MCP HTTP server.
 * This provides the most reliable Claude Code compatibility.
 *
 * Usage:
 *   MCP_API_KEY=midl_xxx node stdio-proxy/index.js
 *
 * Or configure in ~/.claude.json:
 *   {
 *     "mcpServers": {
 *       "midl-discord": {
 *         "command": "node",
 *         "args": ["path/to/midl-agent-bundle/stdio-proxy/index.js"],
 *         "env": { "MCP_API_KEY": "midl_xxx" }
 *       }
 *     }
 *   }
 */

const MCP_SERVER_URL = process.env.MCP_SERVER_URL || "https://midl-discord-bot.onrender.com/mcp";
const API_KEY = process.env.MCP_API_KEY;

if (!API_KEY) {
  console.error("Error: MCP_API_KEY environment variable required");
  console.error("Get your key by running /setup-mcp in the MIDL Discord server");
  process.exit(1);
}

// Buffer for reading stdin
let inputBuffer = "";

// Server info for MCP protocol
const SERVER_INFO = {
  name: "midl-discord-proxy",
  version: "1.0.0",
};

// Tool definitions (mirrors the remote server)
const TOOLS = [
  {
    name: "check_server_status",
    description: "Check Discord bot connectivity and server status",
    inputSchema: {
      type: "object",
      properties: {
        apiKey: {
          type: "string",
          description: "Your MCP API key from /setup-mcp command",
        },
      },
      required: ["apiKey"],
    },
  },
  {
    name: "create_discord_thread",
    description: "Post a diagnostic report to the Discord forum as a new thread",
    inputSchema: {
      type: "object",
      properties: {
        apiKey: {
          type: "string",
          description: "Your MCP API key from /setup-mcp command",
        },
        reportMarkdown: {
          type: "string",
          description: "The diagnostic report content in markdown format",
        },
        title: {
          type: "string",
          description: "Thread title (max 100 chars)",
        },
        summary: {
          type: "string",
          description: "Brief summary of the issue",
        },
        authorName: {
          type: "string",
          description: "Name to display as report author",
        },
      },
      required: ["apiKey", "reportMarkdown", "title", "summary"],
    },
  },
  {
    name: "list_recent_threads",
    description: "List recently created threads. Returns your own recent posts or searches by title for duplicate checking.",
    inputSchema: {
      type: "object",
      properties: {
        apiKey: {
          type: "string",
          description: "Your MCP API key from /setup-mcp command",
        },
        searchTitle: {
          type: "string",
          description: "Optional: search for threads with similar title (for duplicate checking)",
        },
      },
      required: ["apiKey"],
    },
  },
];

/**
 * Send JSON-RPC response to stdout
 */
function sendResponse(response) {
  const json = JSON.stringify(response);
  process.stdout.write(json + "\n");
}

/**
 * Send JSON-RPC error response
 */
function sendError(id, code, message) {
  sendResponse({
    jsonrpc: "2.0",
    error: { code, message },
    id,
  });
}

/**
 * Proxy a tool call to the remote server
 */
async function proxyToolCall(toolName, args) {
  // Auto-inject API key if not provided
  const argsWithKey = { ...args, apiKey: args.apiKey || API_KEY };

  const response = await fetch(MCP_SERVER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json, text/event-stream",
      "Authorization": `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: argsWithKey,
      },
      id: "proxy-call",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(result.error.message || "Unknown error from server");
  }

  return result.result;
}

/**
 * Handle incoming JSON-RPC request
 */
async function handleRequest(request) {
  const { method, params, id } = request;

  try {
    switch (method) {
      case "initialize":
        // MCP handshake - return capabilities
        sendResponse({
          jsonrpc: "2.0",
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {},
            },
            serverInfo: SERVER_INFO,
          },
          id,
        });
        break;

      case "notifications/initialized":
        // No response needed for notifications
        break;

      case "tools/list":
        // Return tool definitions
        sendResponse({
          jsonrpc: "2.0",
          result: { tools: TOOLS },
          id,
        });
        break;

      case "tools/call":
        // Proxy tool call to remote server
        const { name, arguments: args } = params;
        const result = await proxyToolCall(name, args || {});
        sendResponse({
          jsonrpc: "2.0",
          result,
          id,
        });
        break;

      default:
        sendError(id, -32601, `Method not found: ${method}`);
    }
  } catch (error) {
    sendError(id, -32603, error.message || "Internal error");
  }
}

/**
 * Process incoming data from stdin
 */
function processInput(data) {
  inputBuffer += data;

  // Process complete JSON-RPC messages (newline-delimited)
  let newlineIndex;
  while ((newlineIndex = inputBuffer.indexOf("\n")) !== -1) {
    const line = inputBuffer.slice(0, newlineIndex).trim();
    inputBuffer = inputBuffer.slice(newlineIndex + 1);

    if (line) {
      try {
        const request = JSON.parse(line);
        handleRequest(request);
      } catch (error) {
        sendError(null, -32700, "Parse error");
      }
    }
  }
}

// Set up stdin/stdout for JSON-RPC
process.stdin.setEncoding("utf8");
process.stdin.on("data", processInput);
process.stdin.on("end", () => process.exit(0));

// Log to stderr (doesn't interfere with JSON-RPC on stdout)
console.error("MIDL MCP Stdio Proxy started");
console.error(`Proxying to: ${MCP_SERVER_URL}`);

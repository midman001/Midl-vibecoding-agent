# midl-discord-mcp

MIDL Discord MCP client for Claude Code integration. This package enables Claude Code to post diagnostic reports and interact with the MIDL Discord community.

## Setup

### 1. Get your API key

Run `/setup-mcp` in the [MIDL Discord server](https://discord.gg/midl) to get your personal API key.

### 2. Clone the MIDL Agent repo

```bash
git clone https://github.com/midman001/Midl-vibecoding-agent.git
```

### 3. Configure Claude Code

Add to your `.mcp.json` (project) or `~/.claude.json` (global):

**Windows:**
```json
{
  "mcpServers": {
    "midl-discord": {
      "command": "node",
      "args": ["C:\\path\\to\\Midl-vibecoding-agent\\stdio-proxy\\index.js"],
      "env": {
        "MCP_API_KEY": "midl_your_api_key_here"
      }
    }
  }
}
```

**macOS/Linux:**
```json
{
  "mcpServers": {
    "midl-discord": {
      "command": "node",
      "args": ["/path/to/Midl-vibecoding-agent/stdio-proxy/index.js"],
      "env": {
        "MCP_API_KEY": "midl_your_api_key_here"
      }
    }
  }
}
```

### 4. Restart Claude Code

Restart Claude Code to load the new MCP server.

## Available Tools

### `check_server_status`
Check Discord bot connectivity and server status.

### `create_discord_thread`
Post a diagnostic report to the MIDL Discord forum as a new thread.

**Parameters:**
- `reportMarkdown` - The diagnostic report content in markdown format
- `title` - Thread title (max 100 chars)
- `summary` - Brief summary of the issue
- `authorName` (optional) - Name to display as report author

### `list_recent_threads`
List recently created threads or search by title for duplicate checking.

**Parameters:**
- `searchTitle` (optional) - Search for threads with similar title

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MCP_API_KEY` | Yes | Your API key from `/setup-mcp` |
| `MCP_SERVER_URL` | No | Override server URL (default: MIDL production) |

## How It Works

This is a stdio proxy that bridges Claude Code to the remote MIDL Discord server:

1. Claude Code communicates via stdin/stdout (MCP protocol)
2. The proxy establishes a session with the MIDL Discord server
3. Tool calls are forwarded to the server and responses returned

## Links

- [MIDL Documentation](https://js.midl.xyz/)
- [MIDL Discord](https://discord.gg/midl)
- [GitHub Repository](https://github.com/midman001/Midl-vibecoding-agent)

## License

MIT

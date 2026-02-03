# MCP Server Setup for Discord Posting

This document is for MCP server operators (MIDL team or self-hosters).
Regular agent users do NOT need this - they only need an MCP_API_KEY.

## For Agent Users

1. Run `/setup-mcp` in the MIDL Discord server to get your API key
2. Add to your `.env` file: `MCP_API_KEY=your-key-here`
3. The agent will use MIDL's hosted MCP server automatically

That's it! The agent is pre-configured to connect to the MIDL-hosted MCP server.

## For Self-Hosters / MCP Server Operators

If you want to run your own MCP server (for development or private deployment):

### Prerequisites

- Discord bot with permissions to create forum threads
- Node.js 18+

### Environment Variables

Create `.env` in the mcp-server directory:

```env
DISCORD_BOT_TOKEN=your-bot-token
DISCORD_GUILD_ID=your-guild-id
DISCORD_FORUM_CHANNEL_ID=your-forum-channel-id
MCP_SERVER_PORT=3847
```

### Running the Server

```bash
cd midl-agent
npm run mcp-server
```

The MCP server listens on `http://localhost:3847` by default.

### Updating Agent Configuration

For local development, the default `claude.json` endpoint is already set to `http://localhost:3847`.

For production, update `claude.json` to point to your hosted server:
```json
{
  "mcpServers": {
    "midl-discord-poster": {
      "command": "npx",
      "args": ["-y", "@anthropic-ai/mcp-proxy", "--endpoint", "https://your-mcp-server.example.com"]
    }
  }
}
```

## Architecture Overview

```
+-------------------+       +-------------------+       +-------------------+
|   Claude Agent    | ----> |   MCP Proxy       | ----> |   MCP Server      |
| (uses MCP_API_KEY)|       | (HTTP transport)  |       | (has BOT_TOKEN)   |
+-------------------+       +-------------------+       +-------------------+
                                                                |
                                                                v
                                                        +-------------------+
                                                        |   Discord API     |
                                                        +-------------------+
```

**Security benefits:**
- Agent users never see or need Discord bot credentials
- MCP server can be operated by MIDL team (hosted) or self-hosters
- Agent only needs MCP_API_KEY to authenticate with the running MCP server
- Bot token is isolated to the MCP server process

## API Key Management

API keys are generated via the `/setup-mcp` Discord command and stored in the MCP server's memory. Each key:
- Is tied to a Discord user ID
- Has rate limiting (5 posts per hour)
- Uses the format: `midl_` + 32 random hex characters

## Troubleshooting

### "MCP server not reachable"
- Verify the MCP server is running: `npm run mcp-server`
- Check the endpoint URL in `claude.json` matches the server address
- For localhost: ensure port 3847 is not blocked

### "Invalid API key"
- Run `/setup-mcp` in Discord to generate a new key
- Ensure MCP_API_KEY is set correctly in your `.env`
- Keys are stored in MCP server memory - restart clears them (regenerate)

### "Rate limit exceeded"
- Wait for rate limit window to reset (1 hour from last post)
- Current limit: 5 posts per hour per API key

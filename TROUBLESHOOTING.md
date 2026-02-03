# Troubleshooting

Common issues and solutions for MIDL Agent.

## Installation Issues

### "Cannot find module" errors

**Problem:** Module not found when starting.

**Solution:**
```bash
cd midl-agent
npm install
```

### "Missing required environment variables"

**Problem:** MCP server fails to start with missing variables.

**Solution:** Ensure `.env` file exists with your API key:
```bash
cp .env.example .env
# Edit .env and add your MCP_API_KEY
```

```
MCP_API_KEY=midl_your_key_here
```

## MCP Server Issues

### "Invalid API key"

**Problem:** MCP tools return "Invalid API key" error.

**Causes:**
1. API key not set in `.env`
2. Typo in the API key

**Solutions:**
1. Get a new key by running `/setup-mcp` in the [MIDL Discord](https://discord.com/invite/midl)
2. Copy the full key including the `midl_` prefix

### "MCP server not connecting"

**Problem:** Claude Code can't connect to MCP server.

**Check:**
1. Is the `cwd` path in settings.json correct?
2. Did `npm install` complete successfully?
3. Is Node.js >= 18 installed?

**Debug:** Try running the MCP server manually:
```bash
cd midl-agent
npm run mcp-server
```

You should see: `MIDL MCP Server running on stdio`

### "Rate limit exceeded"

**Problem:** Cannot post to Discord - rate limit error.

**Solution:** Wait for the rate limit to reset (1 hour). Each API key allows 5 posts per hour.

**Check your remaining posts:**
Use the `check_server_status` MCP tool.

## Claude Code Integration Issues

### MCP server not showing in Claude Code

**Problem:** The `midl-discord-poster` server doesn't appear.

**Check your settings.json:**
```json
{
  "mcpServers": {
    "midl-discord-poster": {
      "command": "npx",
      "args": ["tsx", "src/mcp-server/index.ts"],
      "cwd": "/absolute/path/to/midl-agent"
    }
  }
}
```

**Common issues:**
1. Path must be absolute, not relative
2. Path must point to `midl-agent` directory, not root
3. Restart Claude Code after changing settings

### Tools not working after settings change

**Problem:** MCP tools don't work after updating settings.json.

**Solution:** Restart Claude Code completely (quit and reopen).

## Getting Help

If these solutions don't work, ask in the [MIDL Discord](https://discord.com/invite/midl) with:
- Full error message
- Steps to reproduce
- Node version (`node --version`)
- OS (Windows/Mac/Linux)

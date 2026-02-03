# Troubleshooting

Common issues and solutions for MIDL Agent.

## Connection Issues

### "Failed to connect to MCP server"

**Problem:** Claude Code can't connect to the hosted MCP server.

**Solutions:**
1. Verify your API key is valid (run `/setup-mcp` in Discord to get a new one)
2. Check that the Authorization header has `Bearer ` prefix (note the space)
3. Ensure the URL is exactly `https://midl-agent.onrender.com/mcp`

**Check your settings:**
```json
{
  "mcpServers": {
    "midl-discord": {
      "type": "url",
      "url": "https://midl-agent.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer midl_your_key_here"
      }
    }
  }
}
```

### "Invalid API key"

**Problem:** MCP tools return "Invalid API key" error.

**Causes:**
1. API key not in Authorization header
2. Missing `Bearer ` prefix
3. Typo in the API key

**Solutions:**
1. Get a new key by running `/setup-mcp` in the [MIDL Discord](https://discord.com/invite/midl)
2. API keys start with `midl_` prefix
3. Keys are single-use credentials tied to your Discord account
4. Ensure the header format is `Bearer YOUR_KEY` (with a space after Bearer)

### "Rate limit exceeded"

**Problem:** Cannot post to Discord - rate limit error.

**Solution:** Wait for the rate limit to reset. Each API key allows 5 posts per hour.

**Check your remaining posts:**
Use the `check_server_status` MCP tool.

## Claude Code Integration Issues

### MCP server not showing in Claude Code

**Problem:** The `midl-discord` server doesn't appear.

**Check your MCP settings:**
1. Open Claude Code settings
2. Look for `mcpServers` section
3. Verify `midl-discord` entry exists with `type: "url"`

**Common issues:**
1. JSON syntax errors in settings file
2. Missing `type: "url"` (required for HTTP servers)
3. Missing `headers` object with Authorization

**After fixing:** Restart Claude Code completely (quit and reopen).

### Tools not working after settings change

**Problem:** MCP tools don't work after updating settings.

**Solution:** Restart Claude Code completely (quit and reopen).

## Getting Help

If these solutions don't work, ask in the [MIDL Discord](https://discord.com/invite/midl) with:
- Full error message
- Steps to reproduce
- OS (Windows/Mac/Linux)

# MIDL Agent

Your AI coding companion for building Web3 applications on Bitcoin with the MIDL JavaScript SDK.

## What It Does

**Real-time MIDL SDK assistance** - Ask anything about the MIDL.js library and get accurate, up-to-date answers pulled directly from the documentation. No more digging through docs or outdated Stack Overflow answers.

**Bug report generation** - When you hit a wall, the agent generates structured diagnostic reports with your environment, error details, and suggested fixes.

**Direct Discord support** - Post your bug reports straight to the MIDL Discord support forum without leaving Claude Code.

## Quick Start

### Prerequisites

- Claude Code CLI installed (`claude --version`)
- Discord account (for MCP API key)

### Step 1: Clone the Agent

```bash
git clone https://github.com/midman001/Midl-vibecoding-agent.git
cd Midl-vibecoding-agent
```

### Step 2: Get your MCP API key

1. Join the [MIDL Discord server](https://discord.com/invite/midl)
2. Complete verification as described in the welcome channel
3. Run `/setup-mcp` in any channel
4. Copy the API key from the ephemeral message

### Step 3: Configure Claude Code

Add to your Claude Code settings (`~/.claude.json`):

```json
{
  "projects": {
    "/path/to/your/project": {
      "systemPromptFile": "/path/to/Midl-vibecoding-agent/midl-vibecoding-agent.md"
    }
  },
  "mcpServers": {
    "midl-discord": {
      "command": "node",
      "args": ["/path/to/Midl-vibecoding-agent/stdio-proxy/index.js"],
      "env": {
        "MCP_API_KEY": "YOUR_MCP_API_KEY"
      }
    }
  }
}
```

Replace:
- `/path/to/your/project` with your actual project directory
- `/path/to/Midl-vibecoding-agent` with where you cloned this repo
- `YOUR_MCP_API_KEY` with the key from step 2

**Alternative: Direct HTTP connection** (if you don't want to run the local proxy)

```json
{
  "mcpServers": {
    "midl-discord": {
      "type": "url",
      "url": "https://midl-discord-bot.onrender.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_MCP_API_KEY"
      }
    }
  }
}
```

Note: Direct HTTP may have compatibility issues with some Claude Code versions. The stdio proxy is more reliable.

### Step 4: Verify Installation

Start a new Claude Code session in your project and ask:

> "Check the MIDL MCP server status"

Claude should respond with server connection details and your rate limit status.

## What Gets Installed

| Component | Purpose |
|-----------|---------|
| `midl-vibecoding-agent.md` | Agent behavior and MIDL knowledge base |
| `stdio-proxy/index.js` | Local proxy for reliable MCP connection |

The system prompt teaches Claude to:
- Auto-fetch MIDL SDK docs at session start
- Recognize MIDL-related questions and activate specialized assistance
- Generate diagnostic reports for bugs
- Post issues to Discord support forum

## Usage

### Ask About MIDL SDK

Just ask naturally:
> "How do I use the useBroadcast hook to send BTC?"

> "What's the difference between testnet4 and mainnet configuration?"

> "Show me how to set up MidlProvider in my React app"

The agent fetches current documentation and gives you accurate code examples.

### Get Help With Errors

When something breaks:
> "I'm getting 'unknown letter x in PSBT' when trying to broadcast"

The agent will:
1. Analyze your error
2. Check the docs for known issues
3. Generate a diagnostic report with suggested fixes

### Post to Discord Support

If you're still stuck:
> "Post this to the MIDL Discord forum"

Creates a support thread directly from Claude Code. Rate limit: 5 posts/hour.

## Documentation

- [EXAMPLES.md](EXAMPLES.md) - Usage scenarios
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

## Links

- [MIDL SDK Documentation](https://js.midl.xyz/docs)
- [MIDL Discord](https://discord.com/invite/midl)

## License

MIT - see [LICENSE](LICENSE)

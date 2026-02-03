# MIDL Agent

AI assistant for vibecoders building Web3 applications on Bitcoin using the MIDL JavaScript SDK.

## Features

- **Diagnostic Report Generation** - Comprehensive bug reports with environment details, steps taken, and suggestions
- **Discord Integration** - Post reports to MIDL Discord support forum
- **MCP Server** - Secure Discord posting from Claude Code without credential exposure

## Quick Start

### Prerequisites

- [ ] Node.js >= 18.0.0 (`node --version`)
- [ ] Claude Code CLI installed (`claude --version`)
- [ ] Discord account for API key

### Installation

**Step 1: Clone the repository**
```bash
git clone https://github.com/midman001/Midl-vibecoding-agent.git
cd Midl-vibecoding-agent
```

**Step 2: Install dependencies**
```bash
npm install
```

**Step 3: Get your MCP API key**
1. Join the MIDL Discord server
2. Run `/setup-mcp` in any channel
3. Copy the API key from the ephemeral message

**Step 4: Configure environment**
```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
MCP_API_KEY=midl_your_key_here
```

**Step 5: Add to Claude Code**

Add to your Claude Code MCP settings (`~/.claude/settings.json`):
```json
{
  "mcpServers": {
    "midl-discord-poster": {
      "command": "npx",
      "args": ["tsx", "src/mcp-server/index.ts"],
      "cwd": "/path/to/midl-agent-bundle/midl-agent"
    }
  }
}
```

Replace `/path/to/` with your actual path.

### Verify Installation

Start a new Claude Code session and ask:
> "Check the MIDL Discord server status"

You should see a response confirming the MCP server is connected.

## Usage

### Generate Diagnostic Report

Ask Claude Code:
> "I'm getting an error with useBroadcast hook - it says 'unknown letter' when trying to send BTC"

The agent will:
1. Extract relevant context from your description
2. Generate a structured diagnostic report
3. Offer to post it to the MIDL Discord support forum

### Post to Discord

After generating a report, say:
> "Post this to the MIDL Discord forum"

The agent will use the MCP server to create a new thread with your report.

### Check Rate Limits

Each API key allows 5 posts per hour. Check your remaining posts:
> "Check my Discord posting rate limit"

## For MCP Server Operators

If you're running your own Discord bot and MCP server (not using MIDL's hosted service), see [MCP-SETUP.md](midl-agent/MCP-SETUP.md).

## Documentation

- [MIDL-AGENT.md](midl-agent/MIDL-AGENT.md) - Agent system prompt and capabilities
- [MCP-SETUP.md](midl-agent/MCP-SETUP.md) - MCP server operator guide
- [.env.example](midl-agent/.env.example) - Environment variable template
- [EXAMPLES.md](EXAMPLES.md) - Usage scenarios
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - Common issues and solutions
- [CONTRIBUTING.md](CONTRIBUTING.md) - How to contribute

## Links

- [MIDL SDK Documentation](https://js.midl.xyz/docs)
- [MIDL Discord](https://discord.gg/midl)
- [GitHub Issues](https://github.com/midl-xyz/midl-agent-bundle/issues)

## License

MIT - see [LICENSE](LICENSE)

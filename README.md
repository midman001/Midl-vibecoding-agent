# MIDL Agent

Your AI coding companion for building Web3 applications on Bitcoin with the MIDL JavaScript SDK.

## What It Does

**Real-time MIDL SDK assistance** — Ask anything about the MIDL.js library and get accurate, up-to-date answers pulled directly from the documentation. No more digging through docs or outdated Stack Overflow answers.

**Smart routing** — Simple questions get answered instantly. Heavy research, bug reports, and deep code reviews get delegated to a worker agent so your main conversation stays clean.

**Discord commands** — Share wins, report bugs, ask for advice, or show off your build to the MIDL community without leaving Claude Code.

## Quick Start

### Prerequisites

- Claude Code CLI installed (`claude --version`)
- Discord account (for posting to MIDL Discord)

### Step 1: Install the Skill

Clone to your Claude Code skills directory:

```bash
git clone https://github.com/midman001/Midl-vibecoding-agent.git ~/.claude/skills/midl-vibecoding-agent
```

The skill auto-registers — Claude will detect MIDL-related topics and activate it.

### Step 2: Install the Commands

Copy the Discord commands to your Claude Code commands directory:

```bash
mkdir -p ~/.claude/commands/midl
cp ~/.claude/skills/midl-vibecoding-agent/commands/*.md ~/.claude/commands/midl/
```

This gives you access to:

| Command | What it does |
|---------|-------------|
| `/midl:share-win` | Share a success or milestone with the community |
| `/midl:report-bug` | Generate a diagnostic report and post to Discord |
| `/midl:ask-community` | Ask the builders forum for advice |
| `/midl:show-build` | Show off a dApp or feature you built |

### Step 3: Get Your MCP API Key (for Discord posting)

1. Join the [MIDL Discord server](https://discord.com/invite/midl)
2. Complete verification as described in the welcome channel
3. Run `/setup-mcp` in any channel
4. Copy the API key from the ephemeral message

### Step 4: Configure the MCP Server

Add the Discord MCP server to your Claude Code config. Edit `~/.claude.json`:

```json
{
  "mcpServers": {
    "midl-discord": {
      "command": "node",
      "args": ["~/.claude/skills/midl-vibecoding-agent/stdio-proxy/index.js"],
      "env": {
        "MCP_API_KEY": "YOUR_MCP_API_KEY"
      }
    }
  }
}
```

Replace `YOUR_MCP_API_KEY` with the key from step 3.

**Windows users:** Use forward slashes in paths:
```json
"args": ["C:/Users/yourname/.claude/skills/midl-vibecoding-agent/stdio-proxy/index.js"]
```

**Alternative: Direct HTTP connection** (if you don't want to run the local proxy):

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

### Step 5: Verify Installation

Start a new Claude Code session and try:

> "What MIDL SDK hooks are available for broadcasting?"

Claude should activate the MIDL Agent personality and give you a detailed answer.

## How It Works

The MIDL Agent uses a **skill + worker** architecture:

```
User says something MIDL-related
  -> Skill detects it (auto-match or explicit /midl-vibecoding-agent)
  -> Simple question? Answered inline with MIDL Agent personality
  -> Heavy work? Spawns a worker agent with full MIDL knowledge base
  -> Worker researches docs, generates reports, reviews code
  -> Results presented back in main conversation
  -> Discord posting? Handled inline (MCP tools need main context)
```

**Why this matters:**
- Your main conversation doesn't get bloated with doc-fetching and report generation
- Simple Q&A is instant — no subagent overhead
- MCP tools (Discord posting) work correctly in the main context

## What Gets Installed

| Component | Location | Purpose |
|-----------|----------|---------|
| `SKILL.md` | `~/.claude/skills/midl-vibecoding-agent/` | Slim router — personality, routing, inline handling |
| `midl-vibecoding-agent.md` | `~/.claude/skills/midl-vibecoding-agent/` | Full worker prompt — knowledge base, execution instructions |
| `commands/*.md` | `~/.claude/commands/midl/` | Discord slash commands |
| `stdio-proxy/index.js` | `~/.claude/skills/midl-vibecoding-agent/` | Local MCP proxy for Discord |

## Usage

### Ask About MIDL SDK

Just ask naturally — the skill auto-activates on MIDL topics:

> "How do I use the useBroadcast hook to send BTC?"

> "What's the difference between testnet4 and mainnet configuration?"

> "Show me how to set up MidlProvider in my React app"

### Discord Commands

**Share a win:**
```
/midl:share-win
```
Just shipped something? The agent extracts what you built from the conversation, composes a celebratory message, and posts it to the MIDL Discord.

**Report a bug:**
```
/midl:report-bug
```
Hit an error? The agent generates a full diagnostic report from your conversation context — error messages, environment, steps to reproduce — and posts it to Discord's support forum.

**Ask the community:**
```
/midl:ask-community
```
Facing an architecture decision or stuck on an approach? Posts a thoughtful question to the builders forum.

**Show off a build:**
```
/midl:show-build
```
Built something cool? Show-and-tell post to the community with what you built and how.

All commands:
- Extract context from your conversation (minimal questions asked)
- Ask how you want to be identified (Discord @, GitHub, custom name, or anonymous)
- Compose a fresh message (never templated)
- Run content moderation before posting
- Check for duplicate threads
- Post via MCP and share the thread URL

### Get Help With Errors

When something breaks, just describe the issue:

> "I'm getting 'unknown letter x in PSBT' when trying to broadcast"

The agent will analyze, check docs, and offer to post to Discord if you want community help.

## Updating

Pull the latest changes:

```bash
git -C ~/.claude/skills/midl-vibecoding-agent pull
```

If commands were updated, re-copy them:

```bash
cp ~/.claude/skills/midl-vibecoding-agent/commands/*.md ~/.claude/commands/midl/
```

## Documentation

- [EXAMPLES.md](EXAMPLES.md) — Usage scenarios
- [TROUBLESHOOTING.md](TROUBLESHOOTING.md) — Common issues and solutions
- [CONTRIBUTING.md](CONTRIBUTING.md) — How to contribute

## Links

- [MIDL SDK Documentation](https://js.midl.xyz/)
- [MIDL Discord](https://discord.com/invite/midl)
- [MIDL MCP](https://github.com/Svector-anu/midl-mcp) — Deploy contracts, check balances, broadcast transactions

## License

MIT — see [LICENSE](LICENSE)

# Contributing to MIDL Agent

Thank you for your interest in contributing!

## Getting Started

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/midl-agent-bundle.git
   cd midl-agent-bundle/midl-agent
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Create a branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

## Development

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
```

### Building

```bash
npm run build         # Compile TypeScript
```

### Running the Discord Bot

```bash
npm run bot           # Start Discord bot (requires .env)
```

### Running the MCP Server

```bash
npm run mcp-server    # Start MCP server (requires .env)
```

## Code Style

- TypeScript with strict mode
- Vitest for testing
- Constructor dependency injection pattern
- ESM modules (import/export)

## Project Structure

```
midl-agent/
├── src/
│   ├── discord/        # Discord bot and commands
│   ├── mcp-server/     # MCP server for Claude Code
│   ├── search/         # Diagnostic report generation
│   └── types/          # Shared type definitions
├── MIDL-AGENT.md       # Agent system prompt
├── MCP-SETUP.md        # MCP operator guide
└── package.json
```

## Pull Requests

1. Ensure all tests pass: `npm test`
2. Ensure build succeeds: `npm run build`
3. Write clear commit messages
4. Update documentation if needed
5. Submit PR against `main` branch

## Commit Messages

Use clear, descriptive commit messages:
- `feat: add rate limiting to MCP server`
- `fix: resolve Discord connection timeout`
- `docs: update installation guide`
- `test: add api-key-store unit tests`

## Reporting Issues

When reporting issues:
- Use GitHub Issues
- Include steps to reproduce
- Include full error messages
- Include environment details (Node version, OS)

## Questions?

Join the [MIDL Discord](https://discord.gg/midl) for discussion.

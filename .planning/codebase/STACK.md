# Technology Stack

**Analysis Date:** 2026-02-01

## Languages

**Primary:**
- JavaScript (Node.js) - Core scripting and initialization (`init-session.js`)
- TypeScript - Type-safe utility functions and code examples (`utilities.ts`)
- Markdown - Documentation and system prompts (system configuration)

**Secondary:**
- JSON - Configuration files (`claude.json`)
- Bash/Shell - Referenced in deployment and CI/CD contexts

## Runtime

**Environment:**
- Node.js - JavaScript execution runtime for session initialization and scripting
- Browser/Web environment - For Claude Code integration

**Package Manager:**
- npm - Referenced as package distribution mechanism
- No lockfile present in codebase (this is a configuration/documentation package, not a production app)

## Frameworks

**Core:**
- Claude Code - AI assistant framework integration platform
- Model Context Protocol (MCP) - Standardized protocol for integrating external services and tools

**Development/Agent:**
- MIDL Agent - Custom agent system built on Claude for Bitcoin/Web3 development assistance
- Agent system - Command-driven architecture with keyword-based auto-activation

**Runtime Services:**
- MIDL JS SDK (`@midl/react`, `@midl/core`, `@midl/contracts`, `@midl/executor-react`) - Bitcoin and MIDL protocol integration
- React - Frontend framework for Web3 applications (referenced throughout, not directly in this package)

## Key Dependencies

**Critical SDK Packages (Referenced):**
- `@midl/react` v? - React hooks for MIDL integration (useBroadcastTransaction, useERC20Rune)
  - Purpose: Core React integration for Bitcoin and MIDL protocol operations
  - Used for: Transaction broadcasting, rune management, executor interaction

- `@midl/core` v? - Bitcoin and MIDL protocol utilities
  - Purpose: Low-level protocol operations and Bitcoin integration
  - Used for: Transaction construction, validation, protocol interaction

- `@midl/contracts` v? - Contract deployments and ABI definitions
  - Purpose: Smart contract metadata and interface definitions
  - Used for: Contract interaction type safety

- `@midl/executor-react` v? - Executor-specific React functionality
  - Purpose: Specialized hooks for executor-based operations
  - Used for: Smart contract execution flows

**Node.js Built-ins:**
- `fs` - File system operations (`init-session.js`)
- `path` - File path utilities (`init-session.js`)
- `https` - HTTP client for API calls to GitHub and documentation (`init-session.js`)

**External Services (Via HTTPS):**
- GitHub API - Version checking and release tracking
  - Endpoint: `https://api.github.com/repos/midl-xyz/midl-js`
  - Purpose: Latest release detection, package version management

- MIDL Documentation - Live documentation fetching
  - Endpoint: `https://js.midl.xyz/`
  - Purpose: Current SDK documentation, API reference

## Configuration

**Environment:**
- Configuration via `claude.json` file - Agent command definitions, capability flags, SDK package specs
- Session state persisted in `.cache/session-state.json`
- Documentation check state persisted in `.cache/docs-check.json`

**Build/Deployment:**
- Claude Code integration patterns defined in `CLAUDE-CODE-INTEGRATION.md`
- Three deployment options supported:
  1. Project-level: `./.claude/agents/midl-agent/`
  2. User-level: `~/.claude/agents/midl-agent/`
  3. Organization-level: `/opt/claude-agents/midl/`

**Agent Configuration:**
- Agent metadata: `claude.json`
  - Command definitions (init, midl, bug, docs, mcp)
  - Capability declarations (15+ core capabilities)
  - Feature flags (autoDocUpdate, contextAwareness, mcpIntegration, etc.)
  - SDK package reference list

## Platform Requirements

**Development:**
- Claude Code desktop or web application
- Node.js runtime (14+ recommended)
- npm for package management
- Text editor for configuration
- Git for version control (optional)
- HTTPS connectivity for documentation updates and API calls

**Production/Deployment:**
- Claude Code environment with agent capability
- Stable internet connection for MCP server communication
- Optional: MCP servers installed locally for:
  - Bitcoin network interaction
  - Smart contract ABI access
  - MIDL protocol information
  - Real-time documentation search
  - Package dependency resolution

**Integration Points:**
- GitHub API access (for release checking)
- MIDL JS documentation API
- Optional MCP server endpoints

## Caching & State Management

**Session Caching:**
- Location: `.cache/` directory (auto-created)
- Cache files:
  - `session-state.json` - Session metadata and state
  - `docs-check.json` - Latest documentation version info
  - TTL: Session-based with persistent storage between sessions

**Documentation Sync:**
- Automatic check at session start via `init-session.js`
- Version comparison against cached state
- Change detection and user notification
- Timeout: 5000ms for API calls

---

*Stack analysis: 2026-02-01*

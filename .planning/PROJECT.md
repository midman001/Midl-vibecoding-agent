# MIDL Agent Bundle

## What This Is

A specialized Claude Code agent that helps vibecoders build Web3 applications on Bitcoin using the MIDL JavaScript SDK. The agent auto-activates on MIDL-related topics, syncs documentation automatically, analyzes code for security and best practices, and intelligently searches GitHub issues before creating bug reports to reduce duplicates and surface existing solutions.

## Core Value

Vibecoders get instant, expert MIDL SDK assistance with automatic duplicate detection—resolving issues in minutes instead of days while reducing noise for the MIDL team.

## Requirements

### Validated

<!-- Existing capabilities proven in the current codebase -->

- ✓ Auto-activation on MIDL/Bitcoin/Web3 keywords — existing
- ✓ Documentation synchronization from https://js.midl.xyz/ at session start — existing
- ✓ MCP (Model Context Protocol) discovery and integration — existing
- ✓ Code analysis for security issues (hardcoded secrets, injection risks) — existing
- ✓ TypeScript type safety validation — existing
- ✓ React hook usage pattern validation — existing
- ✓ Bitcoin transaction error decoding — existing
- ✓ Best practices checking (error handling, performance) — existing
- ✓ Code template generation (transactions, runes, error handling) — existing
- ✓ Session initialization with cache management — existing
- ✓ Bug report workflow with structured templates — existing

### Active

<!-- New GitHub search feature from improvement patch -->

- [ ] GitHub issue search before bug report creation
- [ ] Duplicate detection with confidence scoring (>75% = duplicate)
- [ ] Solution extraction from existing GitHub issues
- [ ] User decision flow (check existing vs create new)
- [ ] Related issue presentation with similarity scores
- [ ] Search term extraction from user issue descriptions
- [ ] Integration with existing bug report workflow
- [ ] GitHub API authentication and rate limit handling
- [ ] Search result caching (reduce API calls)
- [ ] Configuration for search thresholds and limits
- [ ] Testing mode using midman001/agent-testing repository

### Out of Scope

- Real-time transaction monitoring — Not needed for agent functionality, users can use MCPs
- Contract deployment automation — Too risky, requires manual oversight
- Mainnet transaction execution — Security risk, agent should guide not execute
- Custom blockchain integration beyond MIDL — Agent is MIDL-specific
- Multi-language support — Focused on JavaScript/TypeScript SDK only
- Automatic GitHub issue creation — User should review and confirm all reports
- Machine learning-based similarity — Implementation plan notes this as future enhancement
- Discord/Slack integrations — Future enhancements per patch plan

## Context

**MIDL SDK Ecosystem:**
- MIDL provides native Bitcoin integration for Web3 apps (no bridging)
- Core packages: @midl/react, @midl/core, @midl/contracts, @midl/executor-react
- Target users are "vibecoders" — developers who value speed and approachability
- Documentation at https://js.midl.xyz/, GitHub at midl-xyz/midl-js

**Existing Agent Capabilities:**
- 4 code files: init-session.js, utilities.ts, and configuration/docs
- Session initialization checks docs and discovers MCPs
- Utility functions for code analysis, error decoding, best practices
- System prompt defines auto-activation behavior and tone

**Improvement Patch:**
- Comprehensive implementation plan for GitHub issue search
- Expected 30-40% reduction in duplicate bug reports
- Code templates ready in midl-agent-improvement-patch directory
- All technical architecture and testing strategies defined

**User Pain Point:**
- Duplicate bug reports waste user time (wait 24-48hrs for response)
- Existing solutions buried in GitHub discussions
- No way to discover if issue already reported/solved

## Constraints

- **Platform**: Must run as Claude Code agent — Required for target user base
- **API Access**: Optional GitHub personal access token (read:issues scope) — Recommended for better rate limits, works without for instant use
- **Node.js**: 14+ required — Existing codebase dependency
- **Claude Code Integration**: Must use agent hooks and system prompt format — Platform requirement
- **Rate Limits**: GitHub API has 5000 req/hr authenticated limit — Design searches to stay within limit
- **Response Time**: Search must complete in <5 seconds — User experience requirement from patch
- **Backward Compatibility**: Must not break existing bug report workflow — Existing users depend on current behavior
- **Read-only GitHub**: No write permissions to issues — Security and user control
- **Codebase Size**: Keep agent lightweight, minimal dependencies — Fast initialization

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| GitHub repository distribution | Users can clone/install easily, version control built-in | — Pending |
| Use @octokit/rest for GitHub API | Official GitHub client, well-maintained, TypeScript support | — Pending |
| Duplicate threshold 75% similarity | Balance false positives vs false negatives per patch analysis | — Pending |
| Search top 5 results only | Performance vs comprehensiveness tradeoff | — Pending |
| Show solutions before creating report | Reduce duplicates, faster user resolution | — Pending |
| Keep existing bug report workflow intact | Backward compatibility, gradual rollout | — Pending |
| Testing mode with midman001/agent-testing repo | Safe testing without polluting production repo or rate limits | — Pending |
| GitHub token optional (graceful degradation) | Works instantly without setup (60 req/hr), upgradeable with token (5000 req/hr) for power users | ✓ Decided 2026-02-01 |

---
*Last updated: 2026-02-01 after token policy decision*

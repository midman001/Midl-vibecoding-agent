# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Vibecoders get instant, expert MIDL SDK assistance with comprehensive diagnostic reports--resolving issues in minutes instead of days.
**Current focus:** Phase 6.1 - MCP Server for Discord Posting (in progress)

## Current Position

Phase: 6.1 of 7 (MCP Server for Discord Posting)
Plan: 1 of 5 in phase
Status: In progress
Last activity: 2026-02-03 - Completed 06.1-01-PLAN.md

Progress: [#######################-] 93% (23/29 total plans complete)

## Performance Metrics

**Velocity:**
- Total plans completed: 23
- Average duration: 2.8 min
- Total execution time: 65 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-github-api-foundation | 1 | 3 min | 3 min |
| 02-search-duplicate-detection | 3 | 7 min | 2.3 min |
| 03-solution-extraction-user-flow | 3 | 10 min | 3.3 min |
| 04-testing | 2 | 7 min | 3.5 min |
| 02.1-attachment-content-extraction | 2 | 5 min | 2.5 min |
| 02.2-enhanced-solution-prioritization | 3 | 8 min | 2.7 min |
| 05-remove-github-integration | 3 | 5 min | 1.7 min |
| 06-discord-integration | 5 | 15 min | 3 min |
| 06.1-mcp-server-for-discord-posting | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 06-02 (3 min), 06-03 (3 min), 06-04 (3 min), 06-05 (3 min), 06.1-01 (5 min)
- Trend: stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Testing mode using midman001/agent-testing repository (Phase 1 requirement added)
- Constructor DI pattern: classes accept optional dependencies for testing (01-01)
- Rate limit check uses search resource quota, not core (01-01)
- Token optional with console.warn for unauthenticated mode 60 req/hr (02-01)
- Stop word removal + length sorting for term specificity (02-01)
- Promise.race timeout returning empty array on timeout for graceful degradation (02-01)
- Plain Map-based in-memory cache, no external deps (02-02)
- Cache key normalization: sorted lowercase terms joined by pipe (02-02)
- Jaccard similarity + 0.15 title boost for scoring, no ML (02-03)
- Shared STOP_WORDS in constants.ts for both term-extractor and similarity-scorer (02-03)
- DuplicateDetector as single entry point for Phase 2 feature (02-03)
- Signal-based comment classification for solution extraction (03-01)
- Applicability weights: errorMessage=0.40, sdkVersion=0.20, network=0.15, methodName=0.15, confirmedFix=0.10 (03-01)
- Three applicability levels: very likely (>=0.6), might help (0.3-0.6), probably not relevant (<0.3) (03-01)
- SearchConfig type defined locally in search-config.ts (03-02, parallel with 03-01)
- Regex-based extraction for bug reports, no ML (03-02)
- Graceful degradation: IssueCreator falls back to manual URL on auth failure (03-02)
- WorkflowOrchestrator is the single entry point for all problem reports (03-03)
- FixImplementer scope limited to single-file 1-2 line fixes, no AST parsing (03-03)
- Bug report workflow replaced interview Q&A with context extraction (03-03)
- FixImplementer never writes without user confirmation (03-03)
- Platform-aware mock fs using path normalization for cross-OS test compatibility (04-01)
- Indirect testing of private extractIdentifiers via public API error messages (04-01)
- Duplicate accuracy test threshold >0.1 for Jaccard similarity with differently-worded near-duplicates (04-02)
- Private Map cache for attachment content instead of reusing SearchCache (different value shape) (02.1-01)
- Optional attachmentContent parameter on score() for backward compatibility (02.1-02)
- Org membership check treats any successful Octokit response as member (02.2-01)
- SolutionExtractor accepts optional GitHubClient, defaults isOfficial to false (02.2-01)
- Stateless DiagnosticReportGenerator with pure function on input data, no external deps (02.2-02)
- Error message truncation at 500 chars with "... (truncated)" suffix (02.2-02)
- Fixed 5-section markdown report structure for diagnostic reports (02.2-02)
- Upload diagnostic files to diagnostics/ directory in repo (02.2-03)
- Post-creation issue body update to include file link or embedded report fallback (02.2-03)
- Move GitHub files to legacy/ subdirectories rather than deleting (05-01)
- WorkflowResult simplified to reportDraft + formattedResponse + optional diagnosticReport (05-02)
- handleProblemReport accepts Partial<DiagnosticContext> with defaults for missing fields (05-02)
- Response directs users to Discord or GitHub for sharing reports (05-02)
- DiscordClientDeps interface for constructor DI, consistent with codebase pattern (06-01)
- Private checkRateLimit() with configurable cooldownMs applied to API methods (06-01)
- getForumChannel validates ChannelType.GuildForum with descriptive errors (06-01)
- ForumPoster accepts DiscordClient via constructor DI (06-02)
- Thread URL constructed from guildId + threadId (06-02)
- Title truncation at 100 chars for Discord forum thread name limit (06-02)
- SlashCommand interface in commands/index.ts with Map-based CommandHandler routing (06-03)
- addCommand() for dynamic command registration (e.g., report-bug) (06-03)
- Guild-scoped command registration via REST API for instant updates (06-03)
- Error handler checks replied/deferred state before responding (06-03)
- Factory function createReportBugCommand(orchestrator, forumPoster) for DI consistency (06-04)
- Filename constructed in report-bug.ts, not from WorkflowResult which lacks filename (06-04)
- Bot entry point returns cleanup function for testability and graceful shutdown (06-05)
- DiscordClient.on() method added to expose underlying Client events (06-05)
- postToDiscord catches Discord API errors and returns null, lets config errors propagate (06-05)
- McpDiscordServer uses Map<string, ApiKeyRecord> for in-memory API key storage (06.1-01)
- Lazy Discord connection via ensureDiscordConnection() on first tool call (06.1-01)
- Rate limit checking returns remaining posts and reset time (06.1-01)
- MCP tool responses use JSON.stringify for structured data in text content (06.1-01)

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Attachment Content Extraction (URGENT) - Testing discovered that issues with detailed error reports in attachments were not being detected as duplicates because similarity scoring only used issue title and body text, missing critical context from attached markdown files
- Phase 2.2 inserted after Phase 2.1: Enhanced Solution Prioritization and Detailed Bug Reports (URGENT) - User requirement: (1) Prioritize official team fixes over community suggestions, clearly indicate source; (2) Generate comprehensive .md diagnostic reports with full context (environment, steps taken, fixes attempted, suggestions) and attach to new GitHub issues
- Phase 4.1 inserted after Phase 4: Fix GitHub Search OR Logic (URGENT) - Real-world testing revealed search uses AND logic, preventing duplicate detection when issue titles lack all search terms (e.g., Issue #2 "Xverse and BIP322" not found when searching "executor-react unknown letter xverse bip" because title doesn't contain all terms)
- **2026-02-02: Major architectural pivot** - Phase 4.1 removed. GitHub integration features (search, duplicate detection, issue creation) being removed in new Phase 5. Focus shifting to diagnostic reports only. Discord integration planned for Phase 6. Original Phase 5 (Packaging) moved to Phase 7.
- Phase 6.1 inserted after Phase 6: MCP Server for Discord Posting (URGENT) - Phase 6 implementation created WorkflowOrchestrator.postToDiscord() requiring bot token, which cannot be distributed with public agent. MCP server architecture needed to enable Claude agents to post to Discord without credential exposure.

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-03
Stopped at: Completed 06.1-01-PLAN.md (MCP server foundation with check_server_status tool)
Resume file: None

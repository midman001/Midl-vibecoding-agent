# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-01)

**Core value:** Vibecoders get instant, expert MIDL SDK assistance with automatic duplicate detection--resolving issues in minutes instead of days while reducing noise for the MIDL team.
**Current focus:** Phase 2.1 - Attachment Content Extraction (COMPLETE - all plans)

## Current Position

Phase: 2.1 of 5 (Attachment Content Extraction) - COMPLETE
Plan: 2 of 2 in current phase
Status: Phase complete
Last activity: 2026-02-01 - Completed 02.1-02-PLAN.md

Progress: [##########] 100%

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 2.9 min
- Total execution time: 32 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-github-api-foundation | 1 | 3 min | 3 min |
| 02-search-duplicate-detection | 3 | 7 min | 2.3 min |
| 03-solution-extraction-user-flow | 3 | 10 min | 3.3 min |
| 04-testing | 2 | 7 min | 3.5 min |
| 02.1-attachment-content-extraction | 2 | 5 min | 2.5 min |

**Recent Trend:**
- Last 5 plans: 03-03 (3 min), 04-01 (3 min), 04-02 (4 min), 02.1-01 (2 min), 02.1-02 (3 min)
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

### Roadmap Evolution

- Phase 2.1 inserted after Phase 2: Attachment Content Extraction (URGENT) - Testing discovered that issues with detailed error reports in attachments were not being detected as duplicates because similarity scoring only used issue title and body text, missing critical context from attached markdown files

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-02-01
Stopped at: Completed 02.1-02-PLAN.md (Phase 2.1 fully complete)
Resume file: None

---
phase: 02-search-duplicate-detection
plan: 01
subsystem: search
tags: [github-api, octokit, keyword-extraction, search-pipeline]

# Dependency graph
requires:
  - phase: 01-github-api-foundation
    provides: GitHubClient, Octokit integration, search-types
provides:
  - SearchTermExtractor for keyword extraction from natural language
  - IssueSearcher orchestrating end-to-end search pipeline
  - Optional token support for unauthenticated GitHub API usage
  - SearchResult and SearchOptions types
affects: [02-search-duplicate-detection, 03-ai-scoring-response]

# Tech tracking
tech-stack:
  added: []
  patterns: [keyword-extraction-with-stop-words, promise-race-timeout, di-constructor-pattern]

key-files:
  created:
    - midl-agent/src/search/term-extractor.ts
    - midl-agent/src/search/issue-searcher.ts
  modified:
    - midl-agent/src/types/search-types.ts
    - midl-agent/src/search/github-client.ts
    - midl-agent/src/search/github-client.test.ts

key-decisions:
  - "Token optional with console.warn for unauthenticated mode (60 req/hr)"
  - "Stop word removal + length sorting for term specificity"
  - "Promise.race timeout pattern returning empty array on timeout"

patterns-established:
  - "Timeout via Promise.race: wrap async calls with configurable timeout"
  - "Graceful degradation: return empty results on timeout instead of throwing"

# Metrics
duration: 2min
completed: 2026-02-01
---

# Phase 2 Plan 1: Core Search Pipeline Summary

**Keyword extraction from natural language with IssueSearcher orchestrating GitHub search, optional token, and 5-second timeout**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-01T17:33:21Z
- **Completed:** 2026-02-01T17:34:55Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- GitHub token made optional with unauthenticated fallback (60 req/hr)
- SearchTermExtractor extracts keywords via stop word removal and length-based specificity ranking
- IssueSearcher orchestrates full search pipeline: extract terms, query GitHub, return ranked results
- 5-second timeout enforced via Promise.race

## Task Commits

Each task was committed atomically:

1. **Task 1: Make GitHub token optional and update types** - `08aa8cd` (feat)
2. **Task 2: Search term extractor and IssueSearcher** - `976f570` (feat)

## Files Created/Modified
- `midl-agent/src/types/search-types.ts` - Added SearchResult, SearchOptions; made token/owner/repo optional
- `midl-agent/src/search/github-client.ts` - Token validation replaced with warning for unauthenticated mode
- `midl-agent/src/search/github-client.test.ts` - Updated tests for optional token behavior
- `midl-agent/src/search/term-extractor.ts` - Keyword extraction with stop words, deduplication, specificity sorting
- `midl-agent/src/search/issue-searcher.ts` - Orchestrates search pipeline with timeout

## Decisions Made
- Token optional: warns via console.warn, creates Octokit without auth for 60 req/hr unauthenticated
- Stop word list covers common English words; terms sorted by length (longer = more specific)
- Timeout returns empty array with warning instead of throwing, for graceful degradation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- SearchTermExtractor and IssueSearcher ready for use by scoring pipeline (02-02, 02-03)
- DI pattern maintained for easy testing and composition

---
*Phase: 02-search-duplicate-detection*
*Completed: 2026-02-01*

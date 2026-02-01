---
phase: 03-solution-extraction-user-flow
plan: 02
subsystem: search-infrastructure
tags: [config, bug-report, issue-creation, github-api]
dependency-graph:
  requires: [01-01, 02-03]
  provides: [SearchConfig, BugReportGenerator, IssueCreator, createIssue]
  affects: [03-03]
tech-stack:
  added: []
  patterns: [context-extraction, graceful-degradation, constructor-DI]
key-files:
  created:
    - midl-agent/src/search/search-config.ts
    - midl-agent/src/search/bug-report-generator.ts
    - midl-agent/src/search/bug-report-generator.test.ts
    - midl-agent/src/search/issue-creator.ts
    - midl-agent/src/search/issue-creator.test.ts
  modified:
    - midl-agent/src/search/github-client.ts
decisions:
  - SearchConfig type defined locally (03-01 adds to search-types.ts separately)
  - Regex-based extraction for errors, SDK versions, network, methods
  - Severity inferred from keyword heuristics (crash=critical, error=high, unexpected=medium, else low)
metrics:
  duration: 3 min
  completed: 2026-02-01
---

# Phase 3 Plan 2: Search Config, Bug Report Generation, Issue Creation Summary

**One-liner:** SearchConfig with JSON file override, regex-based BugReportGenerator, and IssueCreator with graceful fallback to manual submission URL.

## What Was Built

### SearchConfig Loader
- `DEFAULT_SEARCH_CONFIG` with duplicateThreshold (0.75), maxResults (5), timeouts, cache TTL, applicability weights
- `loadSearchConfig(path?)` reads JSON file and deep-merges with defaults
- Warns on parse errors, falls back to defaults

### BugReportGenerator
- Extracts error messages, SDK versions (`@midl/react X.Y.Z`), network (testnet/mainnet/signet/regtest), method names from natural language
- Generates titles under 80 chars from method + error context
- Infers severity from keywords (crash/error/unexpected)
- `formatAsMarkdown()` for GitHub issue body
- `formatAsGitHubLink()` for pre-filled issue URL fallback
- Supports additionalContext overrides

### IssueCreator
- `createFromDraft()` creates GitHub issue via API
- On failure (auth/permissions), returns fallback URL for manual submission
- Constructor DI pattern consistent with codebase

### GitHubClient.createIssue
- POST /repos/{owner}/{repo}/issues via Octokit
- Rate limit check before call
- Proper error handling via handleApiError

## Test Results

14 tests passing:
- 11 BugReportGenerator tests (extraction, formatting, edge cases)
- 3 IssueCreator tests (success, failure fallback, URL validation)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test using invalid Vitest matcher**
- **Found during:** Task 2 test verification
- **Issue:** `toStartWith` is not a valid Vitest/Chai matcher
- **Fix:** Changed to `toContain`
- **Files modified:** bug-report-generator.test.ts

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 0dbb836 | SearchConfig loader and createIssue API method |
| 2 | a9a2889 | BugReportGenerator and IssueCreator with tests |

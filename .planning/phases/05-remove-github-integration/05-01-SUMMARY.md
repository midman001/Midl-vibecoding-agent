---
phase: 05-remove-github-integration
plan: 01
subsystem: search
tags: [legacy, gitignore, refactor, github-removal]
dependency-graph:
  requires: [02.2-03]
  provides: [legacy-segregation, clean-codebase]
  affects: [05-02, 05-03]
tech-stack:
  added: []
  patterns: [legacy-directory-segregation]
key-files:
  created:
    - .gitignore
    - midl-agent/src/search/legacy/ (12 source + 11 test files)
    - midl-agent/src/types/legacy/search-types.ts
  modified: []
decisions:
  - id: 05-01-01
    decision: "Move files to legacy/ subdirectories rather than deleting"
    rationale: "Preserves code for potential future use while keeping shipping codebase clean"
metrics:
  duration: 1 min
  completed: 2026-02-02
---

# Phase 05 Plan 01: Move GitHub Files to Legacy Summary

**One-liner:** Segregated 12 GitHub-dependent source files + 11 test files into gitignored legacy/ directories

## What Was Done

### Task 1: Move GitHub-dependent files to legacy/ directories
Moved all GitHub integration files (github-client, issue-searcher, search-cache, similarity-scorer, duplicate-detector, attachment-fetcher, solution-extractor, applicability-scorer, issue-creator, constants, term-extractor, fix-implementer) plus their test files to `midl-agent/src/search/legacy/`. Moved `search-types.ts` to `midl-agent/src/types/legacy/`. Left diagnostic-report-generator, bug-report-generator, search-config, and workflow-orchestrator in place.

**Commit:** 2ce3274

### Task 2: Update .gitignore to exclude legacy directories
Created `.gitignore` with patterns for both legacy directories. Ran `git rm -r --cached` to remove legacy files from git tracking. Verified with `git check-ignore`.

**Commit:** e962797

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- `ls midl-agent/src/search/legacy/` shows 23 files (12 source + 11 test)
- `ls midl-agent/src/types/legacy/` shows search-types.ts
- diagnostic-report-generator.ts, bug-report-generator.ts, search-config.ts, workflow-orchestrator.ts remain in midl-agent/src/search/
- `git check-ignore midl-agent/src/search/legacy/github-client.ts` confirms ignored

## Next Phase Readiness

Plan 05-02 can proceed to rewrite workflow-orchestrator.ts without GitHub dependencies. All GitHub-dependent imports are now in legacy/ and will not interfere.

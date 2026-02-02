---
phase: 05-remove-github-integration
plan: 02
subsystem: search
tags: [workflow, orchestrator, diagnostic-report, refactor, github-removal]
depends_on:
  requires: [05-01]
  provides: [diagnostic-only-orchestrator, simplified-workflow-result]
  affects: [05-03]
tech-stack:
  added: []
  patterns: [diagnostic-pipeline, stateless-generators]
key-files:
  created: []
  modified:
    - midl-agent/src/search/workflow-orchestrator.ts
    - midl-agent/src/search/workflow-orchestrator.test.ts
decisions:
  - id: 05-02-01
    description: "WorkflowResult simplified to reportDraft + formattedResponse + optional diagnosticReport"
  - id: 05-02-02
    description: "handleProblemReport accepts optional Partial<DiagnosticContext> with defaults for missing fields"
  - id: 05-02-03
    description: "formatReportDraftResponse directs users to Discord or GitHub for sharing reports"
metrics:
  duration: 2 min
  completed: 2026-02-02
---

# Phase 5 Plan 2: Rewrite WorkflowOrchestrator to Diagnostic-Only Summary

**One-liner:** Stripped all GitHub dependencies from WorkflowOrchestrator, leaving a simple diagnostic-report-only pipeline with no search, no duplicate detection, no issue creation.

## What Was Done

### Task 1: Rewrite WorkflowOrchestrator to diagnostic-only
- Removed all GitHub-dependent imports (DuplicateDetector, SolutionExtractor, ApplicabilityScorer, IssueCreator, FixImplementer, GitHubClient, AttachmentFetcher, search-types)
- Simplified WorkflowResult interface to 3 fields: reportDraft, formattedResponse, diagnosticReport
- Rewrote handleProblemReport to accept optional Partial<DiagnosticContext> with sensible defaults
- Removed submitReport, implementSolution, formatSolutionsResponse, buildUserContext methods
- Updated formatReportDraftResponse to remove GitHub search references, direct users to Discord/GitHub
- Commit: 34e8392

### Task 2: Rewrite WorkflowOrchestrator tests
- Removed all GitHub mocks (7 mock objects eliminated)
- Tests use real instances of BugReportGenerator and DiagnosticReportGenerator (pure/stateless)
- 6 test cases covering: report draft generation, diagnostic report with 5 sections, no-context path, no GitHub references, MIDL team sharing instructions, generateReportDraft
- Commit: 08fa4f9

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 05-02-01 | WorkflowResult simplified to 3 fields | Removed searchPerformed, duplicatesFound, solutions, hasSolutions since no search exists |
| 05-02-02 | handleProblemReport accepts Partial<DiagnosticContext> | Fills defaults for missing fields, making it easy to pass partial context |
| 05-02-03 | Response directs users to Discord or GitHub | Users manually share reports instead of automated issue creation |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- `npx tsc --noEmit` passes (no errors in active code; legacy/ has expected broken imports)
- `npx vitest run src/search/workflow-orchestrator.test.ts` passes (6/6 tests)
- No GitHub imports in workflow-orchestrator.ts (grep confirmed)
- No GitHub dependencies in bug-report-generator.ts (grep confirmed)

## Next Phase Readiness

Plan 05-03 can proceed. The orchestrator is now fully decoupled from GitHub. Remaining work: clean up any other files that import removed GitHub modules.

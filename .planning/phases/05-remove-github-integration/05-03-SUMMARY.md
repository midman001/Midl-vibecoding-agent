---
phase: 05-remove-github-integration
plan: 03
subsystem: agent-prompts
tags: [system-prompt, workflow-docs, configuration, diagnostic-reports]
dependency-graph:
  requires: ["05-01", "05-02"]
  provides: ["Updated agent prompts and config for diagnostic-only architecture"]
  affects: ["06-discord-integration"]
tech-stack:
  added: []
  patterns: ["diagnostic-report-only workflow"]
key-files:
  created: []
  modified:
    - midl-agent/system-prompt.md
    - midl-agent/bug-report-workflow.md
    - midl-agent/claude.json
decisions:
  - id: "05-03-01"
    description: "System prompt section renamed from 'Bug Reporting & Solution Search' to 'Bug Reporting & Diagnostics'"
  - id: "05-03-02"
    description: "claude.json feature key renamed from bugReportingTools to diagnosticReports"
metrics:
  duration: "2 min"
  completed: "2026-02-02"
---

# Phase 5 Plan 3: Update Agent Prompts and Configuration Summary

**One-liner:** Rewrote system prompt, bug report workflow, and claude.json to remove all GitHub automation references and describe diagnostic-report-only flow.

## What Was Done

### Task 1: Update system-prompt.md
- Renamed section "Bug Reporting & Solution Search" to "Bug Reporting & Diagnostics"
- Replaced 7-step GitHub-centric flow with 4-step diagnostic flow: Listen, Generate Diagnostic Report, Present Report, Guide Sharing
- Removed references to GitHub search, solution presentation, automatic issue creation
- Kept WorkflowOrchestrator.handleProblemReport() as entry point
- Kept key principle about minimal user interactions

### Task 2: Update bug-report-workflow.md and claude.json
- Rewrote workflow diagram to show diagnostic-only flow (extract context, generate draft, generate diagnostic report, present)
- Removed all references to DuplicateDetector, SolutionExtractor, ApplicabilityScorer, FixImplementer, IssueCreator
- Removed "Implementation Assistance" section entirely
- Replaced "Submission" section with "Sharing the Report" section guiding manual Discord/GitHub sharing
- Updated claude.json capability from "Bug reporting with structured templates" to "Diagnostic report generation for bug reports"
- Renamed feature key from "bugReportingTools" to "diagnosticReports"

## Deviations from Plan

None - plan executed exactly as written.

## Verification Results

- system-prompt.md: "GitHub issue" only appears in manual sharing URL context
- system-prompt.md: WorkflowOrchestrator.handleProblemReport still referenced
- bug-report-workflow.md: Zero matches for DuplicateDetector, IssueCreator, SolutionExtractor, ApplicabilityScorer, FixImplementer
- claude.json: Zero matches for "GitHub" in capabilities

## Decisions Made

1. **05-03-01**: System prompt section renamed to "Bug Reporting & Diagnostics" (clearer than alternatives)
2. **05-03-02**: claude.json feature key renamed from `bugReportingTools` to `diagnosticReports` (matches new architecture)

## Next Phase Readiness

Phase 5 (Remove GitHub Integration) is now fully complete. All three waves done:
- 05-01: Moved GitHub-dependent source files to legacy/
- 05-02: Rewrote WorkflowOrchestrator to diagnostic-only
- 05-03: Updated agent prompts and configuration

Ready for Phase 6 (Discord Integration) or Phase 7 (Packaging & Distribution).

# Roadmap: MIDL Agent Bundle

## Overview

This roadmap delivers diagnostic report generation and community integration for the MIDL agent. Phase 5 removes GitHub integration features while preserving diagnostic report capabilities. Phase 6 adds Discord integration. Phase 7 packages everything for distribution.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: GitHub API Foundation** - Authenticated GitHub client with rate limiting
- [x] **Phase 2: Search & Duplicate Detection** - Core search, similarity scoring, and duplicate flagging
- [x] **Phase 2.1: Attachment Content Extraction** (INSERTED) - Fetch and analyze issue attachments for accurate duplicate detection
- [x] **Phase 2.2: Enhanced Solution Prioritization and Detailed Bug Reports** (INSERTED) - Prioritize official team solutions and generate comprehensive diagnostic reports
- [x] **Phase 3: Solution Extraction & User Flow** - Present solutions and integrate with bug report workflow
- [x] **Phase 4: Testing** - Unit and integration tests with >85% coverage
- [x] **Phase 5: Remove GitHub Integration** - Segregate and disable GitHub features, keep diagnostic reports
- [ ] **Phase 6: Discord Integration** - Discord bot with slash commands, forum posting, and dev resource commands
- [ ] **Phase 7: Packaging & Distribution** - README, examples, and installation guide for public release

## Phase Details

### Phase 1: GitHub API Foundation
**Goal**: Agent can authenticate with GitHub and query issues reliably within rate limits
**Depends on**: Nothing (first phase)
**Requirements**: SEARCH-13, SEARCH-14, INTEG-03, INTEG-06
**Success Criteria** (what must be TRUE):
  1. Agent authenticates with GitHub using a personal access token from environment config
  2. Agent queries midl-xyz/midl-js issues endpoint and receives valid results
  3. Agent gracefully handles rate limit exhaustion without crashing
  4. Agent logs or surfaces authentication errors clearly to the user
  5. Agent can switch to testing mode using midman001/agent-testing repository
**Plans**: 1 plan

Plans:
- [x] 01-01-PLAN.md -- GitHub client with auth, rate limiting, repo switching, and smoke tests

### Phase 2: Search & Duplicate Detection
**Goal**: Agent finds relevant existing issues and flags likely duplicates before the user creates a report
**Depends on**: Phase 1
**Requirements**: SEARCH-01, SEARCH-02, SEARCH-03, SEARCH-04, SEARCH-05, SEARCH-06, SEARCH-07, SEARCH-15, INTEG-05
**Success Criteria** (what must be TRUE):
  1. User describes a problem and agent automatically searches GitHub for matching issues
  2. Agent displays top 3-5 related issues with similarity scores
  3. Issues scoring above 75% similarity are flagged as likely duplicates
  4. Search completes within 5 seconds
  5. Repeated searches for the same terms use cached results instead of hitting GitHub API again
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md -- Token optional, search term extraction, and IssueSearcher pipeline
- [x] 02-02-PLAN.md -- In-memory search result cache with TTL
- [x] 02-03-PLAN.md -- Similarity scoring, duplicate detection, and cache wiring

### Phase 2.1: Attachment Content Extraction (INSERTED)
**Goal**: Improve duplicate detection accuracy by including attachment content in similarity scoring
**Depends on**: Phase 2
**Requirements**: Testing discovery - attachment content critical for duplicate detection
**Success Criteria** (what must be TRUE):
  1. Agent fetches markdown/text attachments from issue bodies (GitHub user-attachments links)
  2. Attachment content is included in similarity scoring alongside issue title and body
  3. Issues with detailed error reports in attachments are correctly identified as duplicates
  4. Fetch failures degrade gracefully without breaking duplicate detection
  5. Attachment content is cached with the same TTL as search results
**Plans**: 2 plans

Plans:
- [x] 02.1-01-PLAN.md — TDD: AttachmentFetcher class with URL extraction, content fetching, and caching
- [x] 02.1-02-PLAN.md — Wire attachment content into SimilarityScorer and DuplicateDetector

### Phase 2.2: Enhanced Solution Prioritization and Detailed Bug Reports (INSERTED)
**Goal**: Prioritize official team solutions and generate comprehensive diagnostic reports for new issues
**Depends on**: Phase 2.1
**Requirements**: Testing discovery - need to distinguish official fixes from suggestions, and provide detailed context for new issues
**Plans**: 3 plans

Plans:
- [x] 02.2-01-PLAN.md — Org membership check, isOfficial flag on Solution type, SolutionExtractor update
- [x] 02.2-02-PLAN.md — DiagnosticReportGenerator class with 5-section markdown reports
- [x] 02.2-03-PLAN.md — Wire badges into presentation, diagnostic report workflow integration

**Success Criteria** (what must be TRUE):
  1. Official MIDL team solutions identified via organization membership and shown with "✓ OFFICIAL FIX" badge
  2. Official solutions always appear before community suggestions
  3. Community suggestions shown with neutral disclaimer when no official response exists
  4. Diagnostic reports include 5 sections: problem, environment, steps taken, fixes attempted, suggestions
  5. Reports uploaded as .md attachments to GitHub issues with fallback to embedded markdown

### Phase 3: Solution Extraction & User Flow
**Goal**: Users see existing solutions before creating reports and can choose to proceed or stop
**Depends on**: Phase 2
**Requirements**: SEARCH-08, SEARCH-09, SEARCH-10, SEARCH-11, SEARCH-12, INTEG-01, INTEG-02, INTEG-04
**Success Criteria** (what must be TRUE):
  1. Agent extracts solutions and workarounds from existing issue discussions and presents them to the user
  2. User is prompted to check existing issues or create a new report (clear decision point)
  3. User can proceed with a new bug report if existing solutions do not help
  4. Existing bug report workflow works identically to before when no search results are relevant
  5. Search behavior is configurable via a config file (thresholds, result limits)
**Plans**: 3 plans

Plans:
- [x] 03-01-PLAN.md -- TDD: Solution extraction, applicability scoring, and GitHub comments API
- [x] 03-02-PLAN.md -- Search config, bug report generator, and issue creator
- [x] 03-03-PLAN.md -- Workflow orchestrator and system prompt/workflow doc updates

### Phase 4: Testing
**Goal**: All new code is validated with automated tests covering core paths and edge cases
**Depends on**: Phase 3
**Requirements**: TEST-01, TEST-02, TEST-03, TEST-04, TEST-05, TEST-06, TEST-07, TEST-08, TEST-09
**Success Criteria** (what must be TRUE):
  1. Running the test suite passes with >85% coverage on new code
  2. GitHub API calls in tests use mocked responses (no real API calls)
  3. Duplicate detection accuracy is validated against known duplicate/non-duplicate pairs
  4. Timeout and rate limit edge cases are covered by tests
**Plans**: 2 plans

Plans:
- [x] 04-01-PLAN.md — Unit tests for term-extractor, search-config, fix-implementer + coverage config
- [x] 04-02-PLAN.md — Integration tests for workflow-orchestrator + timeout/rate-limit/duplicate-accuracy edge cases

### Phase 5: Remove GitHub Integration
**Goal**: Segregate GitHub-specific code and disable duplicate detection/issue creation features while preserving diagnostic report generation
**Depends on**: Phase 4
**Requirements**: Architectural pivot - focus on diagnostic reports without GitHub integration
**Plans**: 3 plans

Plans:
- [x] 05-01-PLAN.md — Move GitHub-dependent files to legacy/ directories and gitignore
- [x] 05-02-PLAN.md — Rewrite WorkflowOrchestrator to diagnostic-only with updated tests
- [x] 05-03-PLAN.md — Update agent prompts and configuration to remove GitHub references

**Success Criteria** (what must be TRUE):
  1. GitHub search, duplicate detection, and scoring features are disabled
  2. GitHub issue creation and pushing features are disabled
  3. GitHub-related files moved to legacy/ directory and added to .gitignore
  4. DiagnosticReportGenerator still works and shows reports to user
  5. WorkflowOrchestrator simplified to only generate and display diagnostic reports
  6. All agent prompts updated to remove GitHub feature mentions
  7. Tests updated to reflect new architecture

### Phase 6: Discord Integration
**Goal**: Two-way Discord integration with bot slash commands for dev resources and diagnostic report posting to forum channel
**Depends on**: Phase 5
**Requirements**: Phase 6 context discussion decisions
**Plans**: 5 plans

Plans:
- [ ] 06-01-PLAN.md — Discord.js setup, DiscordClient wrapper, config types, .env.example
- [ ] 06-02-PLAN.md — ForumPoster class for posting diagnostic reports to forum threads
- [ ] 06-03-PLAN.md — Utility slash commands (/help, /status, /links, /networks) and CommandHandler
- [ ] 06-04-PLAN.md — /report-bug slash command wiring WorkflowOrchestrator to ForumPoster
- [ ] 06-05-PLAN.md — Bot entry point, WorkflowOrchestrator Discord wiring, agent config updates

**Success Criteria** (what must be TRUE):
  1. Discord bot connects and responds to slash commands
  2. /report-bug generates diagnostic report and posts to forum channel as new thread
  3. /help, /status, /links, /networks provide useful MIDL dev resources via rich embeds
  4. All slash command responses are ephemeral (private to invoking user)
  5. Forum threads include friendly summary message and .md file attachment
  6. WorkflowOrchestrator can optionally post reports to Discord
  7. Bot has rate limiting to prevent abuse
  8. Agent prompts updated to describe Discord features

### Phase 7: Packaging & Distribution
**Goal**: A developer can discover, install, and configure the agent from the GitHub repository alone
**Depends on**: Phase 6
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04, PKG-05, PKG-06, PKG-07, PKG-08, PKG-09
**Success Criteria** (what must be TRUE):
  1. README explains what the agent does and how to install it in Claude Code
  2. .env.example and config example files exist with documented defaults
  3. At least two example conversation scenarios show the diagnostic report feature in action
  4. Troubleshooting guide covers common issues
  5. LICENSE and CONTRIBUTING files are present
**Plans**: TBD

Plans:
- [ ] 07-01: README, installation guide, and config examples
- [ ] 07-02: Usage examples, troubleshooting, and contribution docs

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 2.1 -> 2.2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. GitHub API Foundation | 1/1 | ✓ Complete | 2026-02-01 |
| 2. Search & Duplicate Detection | 3/3 | ✓ Complete | 2026-02-01 |
| 2.1. Attachment Content Extraction (INSERTED) | 2/2 | ✓ Complete | 2026-02-01 |
| 2.2. Enhanced Solution Prioritization and Detailed Bug Reports (INSERTED) | 3/3 | ✓ Complete | 2026-02-01 |
| 3. Solution Extraction & User Flow | 3/3 | ✓ Complete | 2026-02-01 |
| 4. Testing | 2/2 | ✓ Complete | 2026-02-01 |
| 5. Remove GitHub Integration | 3/3 | ✓ Complete | 2026-02-02 |
| 6. Discord Integration | 5/5 | ✓ Complete | 2026-02-02 |
| 7. Packaging & Distribution | 0/2 | Not started | - |

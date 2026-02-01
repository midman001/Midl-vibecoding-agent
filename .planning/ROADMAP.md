# Roadmap: MIDL Agent Bundle

## Overview

This roadmap delivers GitHub issue search integration into the existing MIDL agent, then packages it for distribution. We start by building the GitHub API foundation, layer search and duplicate detection on top, wire the user-facing flow into the existing bug report workflow, validate everything with tests, and finish with packaging for public distribution.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: GitHub API Foundation** - Authenticated GitHub client with rate limiting
- [x] **Phase 2: Search & Duplicate Detection** - Core search, similarity scoring, and duplicate flagging
- [ ] **Phase 3: Solution Extraction & User Flow** - Present solutions and integrate with bug report workflow
- [ ] **Phase 4: Testing** - Unit and integration tests with >85% coverage
- [ ] **Phase 5: Packaging & Distribution** - README, examples, and installation guide for public release

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
**Plans**: TBD

Plans:
- [ ] 04-01: Unit tests for searcher, analyzer, and extractor
- [ ] 04-02: Integration tests and edge case coverage

### Phase 5: Packaging & Distribution
**Goal**: A developer can discover, install, and configure the agent from the GitHub repository alone
**Depends on**: Phase 4
**Requirements**: PKG-01, PKG-02, PKG-03, PKG-04, PKG-05, PKG-06, PKG-07, PKG-08, PKG-09
**Success Criteria** (what must be TRUE):
  1. README explains what the agent does, how to install it in Claude Code, and how to configure the GitHub token
  2. .env.example and search-config.json example files exist with documented defaults
  3. At least two example conversation scenarios show the search feature in action
  4. Troubleshooting guide covers common issues (auth failure, rate limits, no results)
  5. LICENSE and CONTRIBUTING files are present
**Plans**: TBD

Plans:
- [ ] 05-01: README, installation guide, and config examples
- [ ] 05-02: Usage examples, troubleshooting, and contribution docs

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. GitHub API Foundation | 1/1 | ✓ Complete | 2026-02-01 |
| 2. Search & Duplicate Detection | 3/3 | ✓ Complete | 2026-02-01 |
| 3. Solution Extraction & User Flow | 3/3 | ✓ Complete | 2026-02-01 |
| 4. Testing | 0/2 | Not started | - |
| 5. Packaging & Distribution | 0/2 | Not started | - |

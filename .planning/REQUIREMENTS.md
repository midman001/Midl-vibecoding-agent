# Requirements: MIDL Agent Bundle

**Defined:** 2026-02-01
**Core Value:** Vibecoders get instant, expert MIDL SDK assistance with automatic duplicate detection--resolving issues in minutes instead of days while reducing noise for the MIDL team.

## v1 Requirements

Requirements for initial release with GitHub search integration and packaging.

### GitHub Issue Search

- [ ] **SEARCH-01**: Agent searches GitHub before creating bug report
- [ ] **SEARCH-02**: Agent extracts search terms from user's issue description
- [ ] **SEARCH-03**: Agent queries midl-xyz/midl-js repository for matching issues
- [ ] **SEARCH-04**: Agent displays top 3-5 related issues to user
- [ ] **SEARCH-05**: Agent calculates similarity score for each result (0-1 scale)
- [ ] **SEARCH-06**: Agent detects duplicates with >75% confidence threshold
- [ ] **SEARCH-07**: Agent flags high-confidence duplicates before report creation
- [ ] **SEARCH-08**: Agent extracts solutions from GitHub issue discussions
- [ ] **SEARCH-09**: Agent identifies workarounds in existing issues
- [ ] **SEARCH-10**: Agent presents solutions to user before creating report
- [ ] **SEARCH-11**: User can choose to check existing issue or create new report
- [ ] **SEARCH-12**: User can proceed with new report if existing solutions don't help
- [ ] **SEARCH-13**: Agent handles GitHub API authentication securely
- [ ] **SEARCH-14**: Agent respects GitHub API rate limits (5000 req/hr)
- [ ] **SEARCH-15**: Agent completes search within 5 seconds

### Integration & Workflow

- [ ] **INTEG-01**: Search integrates seamlessly with existing bug report workflow
- [ ] **INTEG-02**: Existing bug report functionality remains unchanged
- [ ] **INTEG-03**: Agent uses @octokit/rest for GitHub API calls
- [ ] **INTEG-04**: Search can be configured via config file
- [ ] **INTEG-05**: Agent caches search results to reduce API calls
- [ ] **INTEG-06**: Agent supports testing mode using midman001/agent-testing repository

### Packaging & Distribution

- [ ] **PKG-01**: GitHub repository has comprehensive README
- [ ] **PKG-02**: Installation instructions for Claude Code included
- [ ] **PKG-03**: License file added (MIT recommended)
- [ ] **PKG-04**: Contributing guidelines documented
- [ ] **PKG-05**: .env.example template created for GITHUB_TOKEN
- [ ] **PKG-06**: search-config.json example with thresholds
- [ ] **PKG-07**: Example conversation scenarios documented
- [ ] **PKG-08**: Real-world usage examples included
- [ ] **PKG-09**: Troubleshooting guide for common issues

### Testing

- [ ] **TEST-01**: Unit tests for GitHub searcher functionality
- [ ] **TEST-02**: Unit tests for issue analyzer (similarity scoring)
- [ ] **TEST-03**: Unit tests for solution extractor
- [ ] **TEST-04**: Integration test for bug report with search
- [ ] **TEST-05**: Test coverage >85% for new code
- [ ] **TEST-06**: Mock GitHub API responses for tests
- [ ] **TEST-07**: Test duplicate detection accuracy
- [ ] **TEST-08**: Test search timeout handling
- [ ] **TEST-09**: Test rate limit handling

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Search

- **SEARCH-V2-01**: Machine learning-based similarity scoring
- **SEARCH-V2-02**: Caching layer with 1-hour TTL
- **SEARCH-V2-03**: Search result analytics and tracking
- **SEARCH-V2-04**: Multi-language query support

### Integrations

- **INTEG-V2-01**: Discord integration for search results
- **INTEG-V2-02**: Slack notifications for potential duplicates
- **INTEG-V2-03**: Auto-flag duplicates for team review

### Enhanced Features

- **FEAT-V2-01**: Solution aggregation across multiple issues
- **FEAT-V2-02**: Real-time transaction monitoring
- **FEAT-V2-03**: Contract deployment templates
- **FEAT-V2-04**: Hardware wallet integration guidance

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mainnet transaction execution | Security risk - agent should guide, not execute real transactions |
| Automatic GitHub issue creation | User must review and confirm all reports for accuracy |
| GitHub write permissions | Read-only for security, prevents accidental modifications |
| Multi-blockchain support | Agent is MIDL-specific, expanding scope decreases quality |
| Custom blockchain integration | Not part of MIDL SDK, out of agent's domain |
| Machine learning in v1 | Complexity vs value, noted as v2 enhancement in patch |
| Discord/Slack in v1 | Integration overhead, noted as future enhancement |
| Real-time monitoring | Resource intensive, users can use MCPs for this |
| Auto-close duplicates | Requires write permissions, human judgment needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEARCH-01 | Phase 2 | Pending |
| SEARCH-02 | Phase 2 | Pending |
| SEARCH-03 | Phase 2 | Pending |
| SEARCH-04 | Phase 2 | Pending |
| SEARCH-05 | Phase 2 | Pending |
| SEARCH-06 | Phase 2 | Pending |
| SEARCH-07 | Phase 2 | Pending |
| SEARCH-08 | Phase 3 | Pending |
| SEARCH-09 | Phase 3 | Pending |
| SEARCH-10 | Phase 3 | Pending |
| SEARCH-11 | Phase 3 | Pending |
| SEARCH-12 | Phase 3 | Pending |
| SEARCH-13 | Phase 1 | Complete |
| SEARCH-14 | Phase 1 | Complete |
| SEARCH-15 | Phase 2 | Pending |
| INTEG-01 | Phase 3 | Pending |
| INTEG-02 | Phase 3 | Pending |
| INTEG-03 | Phase 1 | Complete |
| INTEG-04 | Phase 3 | Pending |
| INTEG-05 | Phase 2 | Pending |
| INTEG-06 | Phase 1 | Complete |
| PKG-01 | Phase 5 | Pending |
| PKG-02 | Phase 5 | Pending |
| PKG-03 | Phase 5 | Pending |
| PKG-04 | Phase 5 | Pending |
| PKG-05 | Phase 5 | Pending |
| PKG-06 | Phase 5 | Pending |
| PKG-07 | Phase 5 | Pending |
| PKG-08 | Phase 5 | Pending |
| PKG-09 | Phase 5 | Pending |
| TEST-01 | Phase 4 | Pending |
| TEST-02 | Phase 4 | Pending |
| TEST-03 | Phase 4 | Pending |
| TEST-04 | Phase 4 | Pending |
| TEST-05 | Phase 4 | Pending |
| TEST-06 | Phase 4 | Pending |
| TEST-07 | Phase 4 | Pending |
| TEST-08 | Phase 4 | Pending |
| TEST-09 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-02-01*
*Last updated: 2026-02-01 after roadmap creation*

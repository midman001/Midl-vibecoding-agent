# Phase 3 Context: Solution Extraction & User Flow

**Created:** 2026-02-01
**Source:** Direct user feedback on bug report workflow UX

## Overview

Phase 3 transforms the agent from a search engine into a debugging partner. Instead of asking users to fill out forms, the agent reads conversation context, searches for solutions, analyzes their applicability, and offers to implement fixes directly.

**Core principle:** Vibecoders want to ship fast, not fill out forms. The agent does the heavy lifting.

---

## Decisions

These are **LOCKED** design choices from user discussion. Plans MUST honor these exactly.

### 1. Context-Aware Bug Reporting

**Decision:** Agent reads conversation context and auto-generates bug reports. No re-asking what user already said.

**Rationale:** Current workflow has 4 phases with ~15 questions. That's friction that drives vibecoders away.

**Implementation:**
- Agent observes user's problem description in conversation
- Extracts key info: error message, SDK version, steps, environment
- Generates complete bug report draft
- Shows draft to user: "Does this look right? (yes/edit/add more)"
- User approves, tweaks, or adds missing info
- Agent provides GitHub submission link

**Anti-pattern:** DO NOT use the interview-style workflow from `bug-report-workflow.md` (Phase 1-4 question gathering).

### 2. Search-First Approach

**Decision:** Always search for existing solutions BEFORE creating bug reports.

**Flow:**
1. User describes problem
2. Agent uses DuplicateDetector (Phase 2 feature) to search GitHub
3. If duplicates/solutions found → show them first
4. User can bail out if solution works
5. Only proceed to bug report if no solution helps

**Why:** Reduces duplicate reports, gets users faster resolutions, reduces MIDL team noise.

### 3. Agent-Authored Reports

**Decision:** Agent writes the bug report, user approves/edits.

**Before (bad):**
```
Agent: "What were you trying to do?"
User: "Send bitcoin"
Agent: "What actually happened?"
User: "It errored"
[...10 more questions...]
```

**After (good):**
```
User: "My transaction fails with 'insufficient funds' but I have enough.
       Using @midl/react 1.2.0 on testnet."

Agent: [Searches, finds solutions, shows them]
       "If those don't help, here's a draft bug report from our conversation:

       **Title:** broadcastTransaction fails with 'insufficient funds'
                 despite sufficient balance
       **Description:** [extracted from conversation]
       **Env:** @midl/react 1.2.0, testnet

       Does this look right? (yes/edit the title/add more info)"
```

**Escape hatches:**
- User can approve as-is
- User can request edits to specific sections
- User can add missing information
- Default path: agent does the work

### 4. Solution Analysis & Applicability Assessment

**Decision:** Agent doesn't just find issues—it analyzes if they actually apply to user's problem.

**Intelligence layers:**

1. **Solution Extraction**
   - Parse issue comments for fixes and workarounds
   - Identify: code changes, config changes, dependency updates
   - Extract context: SDK version, network, method names

2. **Applicability Assessment**
   - Compare issue context to user's context
   - Check preconditions: same SDK version? same network? same error?
   - Confidence scoring: "very likely" vs "might help" vs "probably not relevant"

3. **Reporting Findings**
   - Explain root cause from the issue
   - Explain the fix in user's context
   - Explain WHY it applies to their specific situation
   - Give confidence level

**Example output:**
```
"I found issue #456 that matches your problem (87% similar).

**Root cause:** Testnet fee estimation can fail and return 0, which makes
the transaction appear to have insufficient funds even when you have enough.

**The fix:** Manually set feeRate in your broadcastTransaction call.
This bypasses the broken fee estimator.

**Why this applies to you:** You're on testnet with the same error, so
this is very likely your issue.

Want me to implement this fix in your code?"
```

### 5. Implementation Assistance

**Decision:** Agent offers to implement solutions found in GitHub issues.

**User options:**
1. **"Yes, implement it"** → Agent finds code, applies fix, shows diff
2. **"Show me how"** → Agent provides code example without modifying files
3. **"That's not my issue"** → Proceed to bug report generation

**Implementation approach:**
- Locate relevant code in user's project (search for method calls, imports)
- Apply the fix with clear explanation
- Show before/after diff
- Explain WHY the change works
- User confirms before final write

**Scope limits:**
- Only implement fixes from verified GitHub issues
- Only with explicit user consent ("Yes, implement it")
- Show diff before final write (no silent changes)

### 6. Minimal Friction

**Decision:** Target 1-2 user interactions instead of 15+.

**Success metric:** User describes problem → Agent finds & explains solution (or drafts report) → User approves/tweaks → Done.

**Anti-pattern:** Multi-turn Q&A sessions that feel like filling out a form.

---

## Claude's Discretion

These are areas where Claude has freedom to make implementation choices.

### Solution Parsing Strategy

**Freedom:** How to extract solutions from GitHub issue comments.

**Constraints:**
- Must identify code snippets, config changes, workarounds
- Must distinguish between "this fixed it" vs "tried this, didn't work"
- Must handle multi-comment discussions

**Suggestion:** Look for:
- Comments with ✅ reactions or "this worked" replies
- Code blocks in closing comments
- Comments from repo maintainers
- Links to PRs that closed the issue

### Applicability Confidence Scoring

**Freedom:** How to calculate confidence that a solution applies.

**Constraints:**
- Must output "very likely" / "might help" / "probably not relevant"
- Must compare: SDK version, network (testnet/mainnet), error message text, method names

**Suggestion:** Weighted scoring:
- Exact error message match: +40%
- Same SDK version: +20%
- Same network: +15%
- Same method name: +15%
- Maintainer-confirmed fix: +10%

### Code Location Strategy

**Freedom:** How to find user's code to apply fixes.

**Constraints:**
- Must search for method calls, imports, file patterns
- Must not modify without showing diff first

**Suggestion:**
- Grep for method names (e.g., `broadcastTransaction`)
- Look in common locations (src/, lib/, components/)
- If multiple matches, ask user which file

### User Interaction Phrasing

**Freedom:** Exact wording of prompts to user.

**Constraints:**
- Keep it conversational, not robotic
- Match vibecoder tone (fast, friendly, approachable)
- Always offer escape hatches (edit/skip options)

**Suggestion:** Use phrases like:
- "Want me to implement this fix?"
- "Does this look right?"
- "Should I apply this change?"

Avoid:
- "Please confirm if you would like to proceed with..."
- "Verify that the following is correct..."

---

## Deferred Ideas

These are explicitly OUT OF SCOPE for Phase 3. Do NOT implement.

### Automatic Issue Creation

**Why deferred:** User must review and confirm all GitHub submissions. Automatic posting could create spam or incorrect reports.

**Phase 3 scope:** Agent drafts the report, user submits it manually via GitHub link.

### Automatic Code Changes Without Approval

**Why deferred:** Even with "implement it" confirmation, show diff first. Silent code changes break trust.

**Phase 3 scope:** Always show before/after diff, wait for final confirmation.

### ML-Based Solution Matching

**Why deferred:** Keep it simple like Phase 2 similarity scorer. Keyword matching + context comparison is sufficient.

**Phase 3 scope:** Rule-based applicability assessment (compare versions, networks, error text).

### Multi-File Refactoring Suggestions

**Why deferred:** Too complex for v1. Stick to single-point fixes (add parameter, change config value).

**Phase 3 scope:** Simple fixes only (1-2 line changes, single file).

### Automatic Testing of Fixes

**Why deferred:** Would require running user's code, dependency installation, test execution. Too much complexity.

**Phase 3 scope:** Suggest user test the fix, provide testing guidance if needed.

---

## Integration Points

### With Phase 2 (Search & Duplicate Detection)

- Use `DuplicateDetector.detect()` to search for matching issues
- Parse `DuplicateDetectionResult.duplicates` for high-confidence matches
- Use `formatResults()` output as starting point for presenting to user

### With Existing Bug Report Workflow

- **Deprecate:** The interview-style Phase 1-4 question workflow
- **Keep:** The bug report template structure (title, description, reproduction, environment, error output)
- **Keep:** Category-specific guidance (SDK issues, transaction failures, React hooks, type safety)
- **Keep:** Severity levels (Critical, High, Medium, Low)

### With init-session.js

- Auto-activation on keywords: "bug", "error", "issue", "broken", "fails", "doesn't work"
- Trigger search automatically when user describes a problem
- No explicit command needed (agent is proactive)

---

## Success Metrics

Phase 3 is successful if:

1. ✓ User describes problem in natural language (no interview)
2. ✓ Agent searches GitHub and shows relevant solutions within 5 seconds
3. ✓ Agent explains why a solution applies to user's specific context
4. ✓ Agent offers to implement fix OR drafts bug report (user chooses)
5. ✓ Entire flow completes in 1-3 user interactions (vs 15+ before)
6. ✓ 30-40% reduction in duplicate bug reports (measured after deployment)

---

## Open Questions

None. User has provided clear direction on all design decisions.

---

*Context captured: 2026-02-01*
*Source: Direct user feedback during Phase 2 completion*

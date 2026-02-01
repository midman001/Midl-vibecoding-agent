# MIDL Bug Report Workflow

## Search-First, Context-Aware Flow

When a user reports an issue, the agent uses `WorkflowOrchestrator` to handle the entire flow automatically. The goal is **1-2 user interactions**, not an interview.

### How It Works

```
User describes problem
        ↓
WorkflowOrchestrator.handleProblemReport()
        ↓
┌─ Search GitHub for duplicates (DuplicateDetector)
│   ↓
├─ Fetch comments from top matching issues
│   ↓
├─ Extract solutions (SolutionExtractor)
│   ↓
├─ Score applicability to user's context (ApplicabilityScorer)
│   ↓
├─ Solutions found?
│   ├── YES → Present solutions conversationally
│   │         ├── "Want me to implement this fix?" → FixImplementer
│   │         ├── "Show me how" → Code example
│   │         └── "That's not my issue" → Draft bug report
│   └── NO  → Auto-generate bug report draft
│             └── "Does this look right?" → Submit or edit
```

### Context Extraction

The agent extracts information from the user's natural language description rather than asking questions. It looks for:

- **Error messages**: Any `Error: ...` or quoted error text
- **SDK version**: `@midl/package 1.2.3` patterns
- **Network**: testnet, mainnet, signet, regtest mentions
- **Method names**: SDK method references (broadcastTransaction, useAccount, etc.)
- **Steps to reproduce**: Code blocks, sequences of actions
- **Environment**: Browser, Node.js, OS mentions

If critical information is missing from the description, the agent may ask **one** follow-up question. Never more than that.

### Implementation Assistance (Decision 5)

When a solution is found and the user says "Yes, implement it":

1. `FixImplementer.locateAndPrepareFix()` searches the user's project for relevant code
2. Shows a diff of the proposed change
3. Explains **why** the fix works
4. Only applies the change after explicit user confirmation via `FixImplementer.applyFix()`

**Scope**: Single-file, 1-2 line fixes only. No multi-file refactoring.

## Bug Report Template

When no solution helps, the agent auto-generates a report using `BugReportGenerator`:

```markdown
---
title: [Auto-generated from context]
labels: bug, needs-investigation
---

## Description
[Extracted from user's description]

## Expected Behavior
[Inferred or extracted]

## Actual Behavior
[Error messages and observed behavior]

## Reproduction Steps
[Code blocks and sequences from conversation]

## Environment
- **MIDL SDK Version**: [extracted from description or package.json]
- **Node.js Version**: [if mentioned]
- **Browser**: [if mentioned]
- **Operating System**: [if mentioned]
- **Network**: [testnet/mainnet if mentioned]

## Error Output
```
[Extracted error messages and stack traces]
```
```

## Bug Categories & Guidance

### Category: SDK/API Issues
**What to extract:**
- TypeScript error messages
- Runtime errors
- Method signature being used
- SDK version from package.json

### Category: Transaction Failures
**What to extract:**
- Network (testnet/mainnet)
- Transaction hash if available
- RPC error response
- Broadcasting method used

### Category: React Hook Issues
**What to extract:**
- Component context
- Hook usage pattern
- React version
- Error boundaries or console errors

### Category: Type Safety Issues
**What to extract:**
- TypeScript error number and message
- TypeScript version
- Type definitions being imported
- Code snippet causing the issue

## Severity Levels

The agent infers severity from the description:

**Critical**
- Loss of funds possible
- Major feature completely broken
- Security vulnerability
- Data loss

**High**
- Core functionality broken (error, exception, fail keywords)
- Major performance issue
- Security concern

**Medium**
- Feature partially broken (unexpected, wrong, incorrect keywords)
- Workaround exists
- Documentation mismatch

**Low**
- Minor inconvenience
- Edge case behavior
- Developer experience issue

## Submission

After the user approves the draft:

1. **With write token**: `IssueCreator.createFromDraft()` creates the GitHub issue directly and returns the URL
2. **Without write token**: `BugReportGenerator.formatAsGitHubLink()` generates a pre-filled GitHub issue URL for the user to click

The agent always provides the direct link to the created or pre-filled issue.

## Integration with MCP Tools

When available MCPs include:
- **Transaction Debugger MCP**: Use for analyzing failed transactions
- **Contract ABI MCP**: Use to validate contract interfaces
- **Network Status MCP**: Use to check if network issues could cause the bug
- **Version Info MCP**: Use to confirm exact SDK versions installed

Activate these during bug investigation for deeper insights.

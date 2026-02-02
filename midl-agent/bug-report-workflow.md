# MIDL Bug Report Workflow

## Diagnostic-Report Flow

When a user reports an issue, the agent uses `WorkflowOrchestrator` to generate a comprehensive diagnostic report automatically. The goal is **1-2 user interactions**, not an interview.

### How It Works

```
User describes problem
        ↓
WorkflowOrchestrator.handleProblemReport()
        ↓
┌─ Extract context from description (error messages, SDK version, network, methods)
│       ↓
├─ Generate BugReportDraft (BugReportGenerator)
│       ↓
├─ Generate DiagnosticReport (DiagnosticReportGenerator)
│       ↓
├─ Present to user
        ↓
"Here's a diagnostic report. Share it on Discord or GitHub."
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

## Bug Report Template

The agent auto-generates a report using `BugReportGenerator`:

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

## Sharing the Report

After the diagnostic report is generated, the agent presents it to the user and suggests sharing it on Discord (#support channel) or creating a GitHub issue manually at https://github.com/midl-xyz/midl-js/issues/new with the report content.

## Integration with MCP Tools

When available MCPs include:
- **Transaction Debugger MCP**: Use for analyzing failed transactions
- **Contract ABI MCP**: Use to validate contract interfaces
- **Network Status MCP**: Use to check if network issues could cause the bug
- **Version Info MCP**: Use to confirm exact SDK versions installed

Activate these during bug investigation for deeper insights.

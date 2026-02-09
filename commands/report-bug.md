---
name: midl:report-bug
description: Generate a diagnostic report and post it to the MIDL Discord support forum
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - WebFetch
  - Task
---

<objective>
Generate a comprehensive diagnostic report for a MIDL SDK issue and post it to the MIDL Discord support forum.

The agent does the heavy lifting — extract info from conversation context, generate the report, and post. Target 1-2 user interactions, not 15+ questions.

**Discord is the ONLY bug reporting channel. NEVER suggest GitHub issues.**
</objective>

<process>

<step name="extract_context">
Analyze the current conversation to extract:
- Error messages (exact text)
- SDK version and packages used (@midl/react, @midl/core, etc.)
- Network (mainnet, testnet4, regtest)
- What the user was trying to do
- Code snippets that triggered the error
- Steps to reproduce
- Fixes already attempted

If critical info is missing (no error message, no idea what they were doing), ask ONE focused question. Don't interrogate.
</step>

<step name="generate_report">
Spawn a Task agent (`subagent_type: "general-purpose"`, model: `sonnet`) to generate the diagnostic report.

Pass the agent:
- All extracted context from the conversation
- Instructions to fetch relevant docs from https://js.midl.xyz/llms.txt if helpful
- Request to read the worker prompt from the skill directory for MIDL knowledge:
  `~/.claude/skills/midl-vibecoding-agent/midl-vibecoding-agent.md`

The report must include:
1. **Problem Summary** — 2-3 line description
2. **Environment** — SDK version, packages, network, OS, Node version (if known)
3. **Steps to Reproduce** — numbered list
4. **Error Details** — full error message/stack trace
5. **Code Context** — relevant code snippets
6. **What Was Tried** — fixes attempted
7. **Suggested Investigation** — potential causes, relevant docs

Present the report to the user for review before posting.
</step>

<step name="identify_user">
Ask how they want to be identified on Discord:

Use AskUserQuestion:
- header: "Identity"
- question: "How should I credit you in the Discord post?"
- options:
  - "Discord @username" — they'll provide their handle
  - "GitHub username" — they'll provide their handle
  - "Custom name" — they'll type a name
  - "Anonymous" — post without attribution
</step>

<step name="compose_message">
Write a fresh, organic help-seeking message. NEVER use a template. The message should:

1. Address the community — talk to fellow vibecoders, not "the team"
2. Say you're posting on behalf of [user]
3. Explain the problem in ~3 lines — what went wrong, what they were trying to do
4. Ask for help naturally — "Has anyone run into this?" or "Any ideas?" — vary it!
5. Mention the diagnostic report is attached with full details

**Tone**: Fellow builder asking for help. Not a formal bug report.
</step>

<step name="moderate_content">
**MANDATORY** — Review BOTH the message AND the diagnostic report for:
- Profanity, slurs, or vulgar language
- Rude or disrespectful tone
- Hate speech or harassment
- **Exposed secrets** (API keys, private keys, passwords, .env values)
- Spam or phishing

**ESPECIALLY** check code snippets and error logs for accidentally included secrets.

If anything inappropriate found: flag, ask to rephrase, don't post until clean.
</step>

<step name="check_duplicates">
Use `list_recent_threads` MCP tool to check for similar recent bug reports.
If a similar thread exists, show it to the user — they might find their answer there.
</step>

<step name="post_to_discord">
Use `create_discord_thread` MCP tool:
- `title`: Short descriptive title (max 100 chars), e.g., "PSBT error when broadcasting on testnet4"
- `summary`: The composed community message
- `reportMarkdown`: The full diagnostic report

Share the resulting thread URL with the user.

**If user doesn't have MCP_API_KEY:**
- Direct them to run `/setup-mcp` in the MIDL Discord server
- The command will DM them an API key
- They add it to .env as MCP_API_KEY

**Rate limit:** 5 posts per hour per API key
</step>

</process>

<anti_patterns>
- Don't ask 15 questions before generating the report — extract from conversation
- Don't suggest GitHub issues — Discord is the ONLY channel
- Don't skip content moderation or secrets check
- Don't post without user seeing the report first
</anti_patterns>

<success_criteria>
- [ ] Context extracted from conversation (minimal questions asked)
- [ ] Diagnostic report generated with all available details
- [ ] Report shown to user for review
- [ ] User identity chosen
- [ ] Message composed fresh
- [ ] Content moderation passed (including secrets check)
- [ ] Duplicate check completed
- [ ] Posted to Discord via MCP tool
- [ ] Thread URL shared with user
</success_criteria>

---
name: midl:show-build
description: Show off a dApp or feature you built to the MIDL Discord community
allowed-tools:
  - Read
  - Bash
  - Glob
  - WebFetch
---

<objective>
Post a show-and-tell message to the MIDL Discord when the user wants to demo or showcase a dApp, feature, or interesting implementation.

Tone: show-and-tell — "check this out!"
</objective>

<process>

<step name="extract_context">
Analyze the current conversation to identify:
- What they built (dApp, feature, tool, integration)
- How it works / what it does
- Which MIDL features/hooks/contracts it uses
- Any live URL, repo link, or screenshots they've mentioned
- What makes it interesting or unique

If context is thin, ask ONE question:
"What did you build? Give me the quick pitch."
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
Write a fresh, organic show-and-tell message. NEVER use a template. The message should:

1. Open with excitement — someone built something cool
2. Credit the builder
3. Describe what it does in 2-4 lines — make it sound interesting
4. Highlight the MIDL-specific parts (hooks used, contract patterns, etc.)
5. Include links if available (repo, live demo)
6. Invite the community to check it out, give feedback, or share ideas

**Tone**: Like showing off a cool project at a hackathon. Proud but not arrogant.

**DO NOT**: Oversell, use excessive superlatives, or make claims the user didn't make.
</step>

<step name="moderate_content">
**MANDATORY** — Review the message for:
- Profanity, slurs, or vulgar language
- Rude or offensive tone
- Scams or phishing links
- Misleading claims
- Exposed secrets in any linked repos

Flag and fix before posting.
</step>

<step name="optional_attachment">
Ask the user if they want to attach a detailed project breakdown:

Use AskUserQuestion:
- header: "Attachment"
- question: "Want to attach a detailed breakdown (architecture, features, how it works) to the post?"
- options:
  - "No, just the message" — post the composed message only
  - "Yes, generate one" — generate a project breakdown covering architecture, MIDL features used, and how it works, then attach it as reportMarkdown

If they say yes, draft the breakdown, show it for review, then include it as `reportMarkdown`.
If no, leave `reportMarkdown` empty.
</step>

<step name="check_duplicates">
Use `list_recent_threads` MCP tool to check for recent posts about the same project.
If found, suggest updating the existing thread instead of creating a new one.
</step>

<step name="post_to_discord">
Use `create_discord_thread` MCP tool:
- `title`: Catchy project title (max 100 chars), e.g., "Built a rune swap dApp with MIDL hooks"
- `summary`: The composed show-and-tell message
- `reportMarkdown`: the project breakdown if user opted in, otherwise empty

Share the resulting thread URL with the user.

**If user doesn't have MCP_API_KEY:**
- Direct them to run `/setup-mcp` in the MIDL Discord server
- The command will DM them an API key
- They add it to .env as MCP_API_KEY

**Rate limit:** 5 posts per hour per API key
</step>

</process>

<success_criteria>
- [ ] Build/project details extracted from conversation
- [ ] User identity chosen
- [ ] Message composed fresh — reads like genuine show-and-tell
- [ ] Content moderation passed
- [ ] Duplicate check completed
- [ ] Posted to Discord via MCP tool
- [ ] Thread URL shared with user
</success_criteria>

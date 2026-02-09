---
name: midl:ask-community
description: Ask the MIDL Discord builders forum for advice or help
allowed-tools:
  - Read
  - Bash
  - Glob
  - WebFetch
---

<objective>
Post a question or advice request to the MIDL Discord builders forum when the user wants community input on architecture, approach, or technical decisions.

Tone: curious and collaborative — "what would you do?"
</objective>

<process>

<step name="extract_context">
Analyze the current conversation to understand:
- What question or decision the user is facing
- Technical context (what they're building, what stack, which MIDL features)
- What approaches they've considered
- Why they want community input (stuck, multiple options, curiosity)

If the question isn't clear from context, ask ONE question:
"What do you want to ask the community? Quick version."
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
Write a fresh, organic question/advice-seeking message. NEVER use a template. The message should:

1. Address the community as fellow builders
2. Credit the user however they chose
3. Set the scene — what they're building and why this question matters (2-3 lines)
4. Ask the actual question clearly
5. Mention approaches considered (if any) — shows they've thought about it
6. Invite discussion — "How would you approach this?" or "What's worked for you?"

**Tone**: Thoughtful builder seeking peers' perspectives. Not a homework question.

**DO NOT**: Sound desperate, dump a wall of code, or ask overly broad questions.
</step>

<step name="moderate_content">
**MANDATORY** — Review the message for:
- Profanity, slurs, or vulgar language
- Rude or disrespectful tone
- Hate speech or harassment
- Spam or phishing
- Exposed secrets (API keys, private keys)

Flag and fix before posting.
</step>

<step name="check_duplicates">
Use `list_recent_threads` MCP tool to check for similar recent questions.
If found, show the existing thread — the answer might already be there.
</step>

<step name="post_to_discord">
Use `create_discord_thread` MCP tool:
- `title`: The question, condensed (max 100 chars), e.g., "Best approach for multi-sig wallet with MIDL hooks?"
- `summary`: The composed message
- `reportMarkdown`: empty (no diagnostic report for questions)

Share the resulting thread URL with the user.

**If user doesn't have MCP_API_KEY:**
- Direct them to run `/setup-mcp` in the MIDL Discord server
- The command will DM them an API key
- They add it to .env as MCP_API_KEY

**Rate limit:** 5 posts per hour per API key
</step>

</process>

<success_criteria>
- [ ] Question/context extracted from conversation
- [ ] User identity chosen
- [ ] Message composed fresh — reads like a real community post
- [ ] Content moderation passed
- [ ] Duplicate check completed
- [ ] Posted to Discord via MCP tool
- [ ] Thread URL shared with user
</success_criteria>

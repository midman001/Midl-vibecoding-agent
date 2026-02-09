---
name: midl:share-win
description: Share a success or milestone with the MIDL Discord community
allowed-tools:
  - Read
  - Bash
  - Glob
  - WebFetch
---

<objective>
Post a celebratory message to the MIDL Discord when the user has shipped something, hit a milestone, or made progress worth sharing.

Tone: hype and celebratory — this is a win, let the community know!
</objective>

<process>

<step name="extract_context">
Analyze the current conversation to identify:
- What the user built, shipped, or achieved
- Which MIDL features they used (SDK hooks, contracts, runes, etc.)
- Any cool technical details worth highlighting
- The project name or description if mentioned

If the conversation doesn't have enough context, ask ONE question:
"What's the win? Quick summary of what you shipped."
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
Write a fresh, organic celebratory message. NEVER use a template or copy examples. The message should:

1. Open with energy — address fellow vibecoders/builders
2. Credit the user however they chose to be identified
3. Describe what they shipped in 2-4 lines — make it sound impressive but real
4. Highlight any interesting technical choices (which MIDL hooks, contract patterns, etc.)
5. Close with encouragement — "go check it out", "another builder shipping", etc.

**Tone**: Like announcing a friend's project in a group chat. Excited but not corporate.

**DO NOT**: Use emojis excessively, sound like a press release, or be cringe.
</step>

<step name="moderate_content">
**MANDATORY** — Before posting, review the ENTIRE message for:
- Profanity, slurs, or vulgar language
- Rude, offensive, or disrespectful tone
- Hate speech, discrimination, or harassment
- Spam, scams, or phishing attempts
- Personal attacks or doxxing
- Exposed secrets (API keys, private keys)

If ANYTHING inappropriate is found:
1. Do NOT post
2. Flag the specific issue to the user
3. Ask them to rephrase
4. Only proceed once clean
</step>

<step name="optional_attachment">
Ask the user if they want to attach a detailed write-up with their post:

Use AskUserQuestion:
- header: "Attachment"
- question: "Want to attach a detailed write-up (tech stack, architecture, lessons learned) to the post?"
- options:
  - "No, just the message" — post the composed message only
  - "Yes, generate one" — generate a short write-up covering what was built, tech choices, and key takeaways, then attach it as reportMarkdown

If they say yes, draft the write-up, show it for review, then include it as `reportMarkdown`.
If no, leave `reportMarkdown` empty.
</step>

<step name="check_duplicates">
Use `list_recent_threads` MCP tool to check for similar recent posts.
If a similar thread exists, tell the user and ask if they still want to post.
</step>

<step name="post_to_discord">
Use `create_discord_thread` MCP tool:
- `title`: Short celebratory title (max 100 chars), e.g., "Just shipped my first MIDL dApp!"
- `summary`: The full composed message
- `reportMarkdown`: the write-up if user opted in, otherwise empty

Share the resulting thread URL with the user.

**If user doesn't have MCP_API_KEY:**
- Direct them to run `/setup-mcp` in the MIDL Discord server
- The command will DM them an API key
- They add it to .env as MCP_API_KEY

**Rate limit:** 5 posts per hour per API key
</step>

</process>

<success_criteria>
- [ ] Win/milestone extracted from conversation
- [ ] User identity chosen
- [ ] Message composed fresh (not templated)
- [ ] Content moderation passed
- [ ] Duplicate check completed
- [ ] Posted to Discord via MCP tool
- [ ] Thread URL shared with user
</success_criteria>

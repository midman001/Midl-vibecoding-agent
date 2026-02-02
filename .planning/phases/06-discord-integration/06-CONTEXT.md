# Phase 6: Discord Integration - Context

**Gathered:** 2026-02-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Two-way Discord integration where:
1. **CLI agent → Discord:** Users can post generated diagnostic reports to Discord forum channel
2. **Discord bot → Users:** Bot provides utility commands for MIDL development resources and network information
3. **(Future/Optional):** Bot monitors forum threads and provides automated assistance

This phase delivers Discord connectivity and helpful bot commands. Advanced monitoring features are deferred.

</domain>

<decisions>
## Implementation Decisions

### Bot Commands & Interaction Model

- **Command type:** Slash commands only (modern Discord slash command API)
- **Available commands:**
  - `/report-bug` - triggers diagnostic report generation flow
  - `/help` - show bot usage guide
  - `/status` - check bot/service status
  - Additional commands at Claude's discretion based on user needs
- **Command visibility:** Ephemeral responses (only user who triggered sees them) - reduces channel noise and keeps diagnostics private
- **Post-report behavior:** After /report-bug generates diagnostic, create public thread for discussion

### Utility Commands Details

- **Command organization:** Claude's discretion (likely `/links` for dev resources, `/networks` for chain info, etc.)
- **/links content includes:**
  - Official MIDL documentation links
  - GitHub repository links
  - Community resources
- **/networks content includes:**
  - RPC endpoints for each network (mainnet, testnet, devnet)
  - Network status (online/offline)
  - Chain IDs and network names
  - Block explorer links
- **Response format:** Rich Discord embeds with organized sections - professional, colored, clickable

### Agent → Discord Posting

- **Posting trigger:**
  - Always ask user after generating report: "Post this to Discord?"
  - Provide command for users to find help on Discord
- **Destination:** Forum channel - auto-create new thread with report
- **Authentication:** Bot token - bot posts on behalf of users
- **User identification:** Bot mentions Discord handle (if user provides it) or any name user specifies
- **Report format:**
  - Attach full diagnostic report as .md file
  - Include human-friendly summary written in cool, friendly Discord tone
  - Summary provides overview, file contains full 5-section diagnostic details

### Forum Monitoring Behavior

- **Status:** Deferred for later discussion / optional feature
- Bot may monitor forum threads and respond helpfully in future iteration
- Not required for Phase 6 completion

### Setup & Configuration

- **Configuration method:** Environment variables in .env file
  - `DISCORD_BOT_TOKEN`
  - `DISCORD_GUILD_ID` (MIDL official server)
  - `DISCORD_FORUM_CHANNEL_ID`
  - Other Discord-specific vars as needed
- **Server scope:** Single server (MIDL official Discord) - not multi-server capable
- **Permissions:** Public access - all server members can use bot commands
- **Rate limiting:** Implement rate limits to prevent spam/abuse
- **Error handling:** Ephemeral error messages shown only to user who triggered command

### Claude's Discretion

- Exact command organization (whether to split /links into multiple commands or keep consolidated)
- Rate limit thresholds (requests per minute/hour)
- Embed color scheme and visual styling
- Discord.js library version and architecture patterns
- Caching strategy for network status / dynamic info
- Bot startup/health check implementation

</decisions>

<specifics>
## Specific Ideas

- Summary messages should have a "cool, friendly tone" - approachable and helpful, not corporate
- Bot should make it easy for users to find help and resources without leaving Discord
- Diagnostic reports maintain their comprehensive 5-section structure but are presented in Discord-friendly way
- User identification should be flexible (Discord handle if known, otherwise any name)

</specifics>

<deferred>
## Deferred Ideas

- **Forum monitoring & auto-response:** Bot watching forum threads and providing automated assistance based on keywords/content - marked as optional, to be discussed later
- **Interactive diagnostic flow in Discord:** Multi-step wizard for collecting bug context directly in Discord (decided against modal/interactive approach for Phase 6)
- **GitHub cross-referencing:** Linking Discord threads to GitHub issues - potential future enhancement

</deferred>

---

*Phase: 06-discord-integration*
*Context gathered: 2026-02-02*

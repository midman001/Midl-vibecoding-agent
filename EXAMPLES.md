# Example Scenarios

Real-world examples of using the MIDL Agent.

## Scenario 1: Ask About the SDK

**User asks Claude Code:**
> How do I set up MidlProvider in my React app?

**Agent fetches MIDL documentation and responds:**
> Here's how to set up MidlProvider in your React application:
>
> ```tsx
> import { MidlProvider } from '@midl/executor-react';
>
> function App() {
>   return (
>     <MidlProvider network="testnet4">
>       <YourApp />
>     </MidlProvider>
>   );
> }
> ```
>
> The `network` prop accepts `"mainnet"`, `"testnet4"`, or a custom config object.
> Make sure to wrap your entire app so all MIDL hooks have access to the context.

---

## Scenario 2: Learn About Hooks

**User asks:**
> What hooks are available for broadcasting transactions?

**Agent responds with current documentation:**
> MIDL provides several hooks for transaction broadcasting:
>
> - `useBroadcast()` - Main hook for broadcasting signed PSBTs
> - `useTransaction()` - Track transaction status after broadcast
> - `useFeeEstimate()` - Get current fee estimates before building tx
>
> Example with useBroadcast:
> ```tsx
> const { broadcast, isPending, error } = useBroadcast();
>
> const handleSend = async (psbt) => {
>   const txid = await broadcast(psbt);
>   console.log('Broadcasted:', txid);
> };
> ```

---

## Scenario 3: Report a Bug

**User asks Claude Code:**
> I'm trying to use the useBroadcast hook but I'm getting an error: "unknown letter 'x' in PSBT". I'm on testnet4, using @midl/executor-react v0.2.1.

**Agent generates diagnostic report:**
```markdown
# Diagnostic Report: PSBT Unknown Letter Error

## Problem Description
Error "unknown letter 'x' in PSBT" when using useBroadcast hook.

## Environment
- Package: @midl/executor-react v0.2.1
- Network: testnet4
- Error: "unknown letter 'x' in PSBT"

## Steps Taken
- User attempting to broadcast transaction
- Using useBroadcast hook from @midl/executor-react

## What We Tried
- No solutions attempted yet

## Suggestions
1. Check if the PSBT is correctly formatted
2. Verify network configuration matches testnet4
3. Ensure wallet is connected to the correct network
```

**Agent offers:**
> Would you like me to post this report to the MIDL Discord support forum?

---

## Scenario 4: Post to Discord via MCP

**User says:**
> Yes, post it to Discord

**Agent uses MCP tool `create_discord_thread`:**
```json
{
  "apiKey": "midl_user_api_key",
  "title": "PSBT Unknown Letter Error",
  "summary": "Error with useBroadcast hook on testnet4",
  "reportMarkdown": "[full diagnostic report]"
}
```

**Agent responds:**
> I've created a thread in the MIDL Discord support forum:
> https://discord.com/channels/guild/thread
>
> The team will review your report and respond in the thread.

---

## Scenario 5: Check for Existing Reports

**User asks:**
> Has anyone else reported issues with PSBT parsing?

**Agent uses MCP tool `list_recent_threads`:**
```json
{
  "apiKey": "midl_user_api_key",
  "searchTitle": "PSBT"
}
```

**Agent responds:**
> I found 2 recent threads about PSBT issues:
>
> 1. **PSBT Unknown Letter Error** - posted today
>    https://discord.com/channels/.../...
>
> 2. **PSBT Parsing Fails on Mainnet** - posted yesterday
>    https://discord.com/channels/.../...
>
> Would you like me to check if your issue matches any of these?

---

## Scenario 6: Quick Status Check

**User asks Claude Code:**
> Check if the MIDL Discord server is available

**Agent uses MCP tool `check_server_status`:**
```json
{
  "apiKey": "midl_user_api_key"
}
```

**Agent responds:**
> **MIDL Discord Server Status:**
>
> - ✅ Connected
> - Server: MIDL Community
> - Forum: #support-forum
> - Rate limit: 4 posts remaining (resets in 45 minutes)

---

## Scenario 7: Rate Limit Hit

**User tries to post too many times:**
> Post another report to Discord

**Agent uses MCP tool and gets error:**
```json
{
  "success": false,
  "error": "Rate limit exceeded. 0 posts remaining. Resets in 2847s"
}
```

**Agent responds:**
> I couldn't post the report - you've reached the rate limit (5 posts per hour).
>
> Your limit resets in about 47 minutes. In the meantime, you can:
> - Save the report locally
> - Post it manually in Discord
> - Wait for the limit to reset

---

## Scenario 8: Invalid API Key

**User hasn't set up their API key:**
> Post this report to Discord

**Agent uses MCP tool and gets error:**
```json
{
  "success": false,
  "error": "Invalid API key. Run /setup-mcp in Discord to get your key."
}
```

**Agent responds:**
> I couldn't post the report - your MCP API key is invalid or not configured.
>
> To get a key:
> 1. Join the [MIDL Discord server](https://discord.com/invite/midl)
> 2. Complete verification in the welcome channel
> 3. Run `/setup-mcp` in any channel
> 3. Add the key to your `.env` file: `MCP_API_KEY=midl_your_key`
> 4. Restart Claude Code
>
> Would you like me to save the report locally instead?

---

## Scenario 9: Detailed Bug with Code

**User provides code and error:**
> I'm getting "TypeError: Cannot read property 'sign' of undefined" when calling this:
>
> ```typescript
> const { broadcast } = useBroadcast();
> await broadcast(psbt);
> ```

**Agent extracts context and generates:**
```markdown
# Diagnostic Report: TypeError in useBroadcast

## Problem Description
TypeError: Cannot read property 'sign' of undefined when calling broadcast()

## Environment
- Hook: useBroadcast from @midl/executor-react
- Method: broadcast(psbt)
- Error type: TypeError (undefined property access)

## Code Sample
```typescript
const { broadcast } = useBroadcast();
await broadcast(psbt);
```

## Steps Taken
- User calling broadcast() method
- PSBT passed as argument
- Error occurs during signing step

## What We Tried
- No solutions attempted yet

## Suggestions
1. Ensure wallet is connected before calling broadcast
2. Check if useBroadcast is being called inside MidlProvider
3. Verify PSBT is properly constructed before broadcast
4. Check that signing function is available in wallet context
```

**Agent offers next steps:**
> This looks like the wallet context isn't available. Before posting to Discord, try:
>
> 1. Make sure your component is inside `<MidlProvider>`
> 2. Check if `useWallet()` returns a connected wallet
>
> Would you like me to post this report, or do you want to try these suggestions first?

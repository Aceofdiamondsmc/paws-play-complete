

## Add Input Validation Guardrails to explore-assistant

### What
Add message count limits, content length caps, and role filtering to the `explore-assistant` edge function to prevent credit exhaustion and prompt injection — addressing the security finding.

### Changes — `supabase/functions/explore-assistant/index.ts`

1. Add guardrail constants at the top of the function:
   - `MAX_MESSAGES = 10` — keep only the last 10 messages
   - `MAX_CHAR_LENGTH = 500` — truncate each message to 500 chars

2. After `const { messages } = await req.json();` (line 40), add validation:
   - Verify `messages` is an array; return 400 if not
   - Filter to only allow `user` and `assistant` roles (strip any injected `system` messages)
   - Slice to last `MAX_MESSAGES`
   - Truncate each message's `content` to `MAX_CHAR_LENGTH`

3. Pass `sanitizedMessages` instead of raw `messages` to the AI gateway call (line 93)

### No other files need changes
The client-side `ExploreAssistant.tsx` already sends only user/assistant messages and doesn't need modification.


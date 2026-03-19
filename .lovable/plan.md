

## Speed Up Message Button on Pack Tab

### Problem
When tapping "Message" on the Pack tab, `handleMessage` calls `startConversation` which:
1. Checks local state for an existing conversation
2. If not found, INSERTs a new conversation row
3. Then calls `fetchConversations()` which re-fetches ALL conversations with N+1 queries (last message + unread count per conversation)
4. Only THEN navigates to `/me?chat={id}`

This waterfall makes the button feel sluggish. There's also no loading indicator, so users don't know anything is happening.

### Solution

**File: `src/pages/Pack.tsx`**

1. **Add a `messagingOwnerId` loading state** to track which owner's message button was tapped
2. **Navigate immediately** after getting the conversation ID — don't await `fetchConversations()` refresh
3. **Disable the button** and show a spinner while the async call is in progress to prevent double-taps

**File: `src/hooks/useMessages.tsx`**

4. **Remove the `await fetchConversations()` call** inside `startConversation` after insert — the realtime subscription will pick up the new conversation, and we navigate away immediately anyway. This eliminates the expensive N+1 re-fetch blocking the navigation.

### Technical Details

In `Pack.tsx`, the `handleMessage` function becomes:

```typescript
const [messagingOwnerId, setMessagingOwnerId] = useState<string | null>(null);

const handleMessage = async (ownerId: string) => {
  if (!user || messagingOwnerId) return;
  setMessagingOwnerId(ownerId);
  try {
    const { conversation, error } = await startConversation(ownerId);
    if (error) { toast.error('Failed to start conversation'); return; }
    if (conversation) packNavigate(`/me?chat=${conversation.id}`);
  } finally {
    setMessagingOwnerId(null);
  }
};
```

The Message button gets `disabled={messagingOwnerId === currentDog.owner_id}` and shows a spinner when loading.

In `useMessages.tsx`, the `startConversation` function changes from:
```typescript
if (!error) { await fetchConversations(); }
```
to:
```typescript
if (!error) { fetchConversations(); } // fire-and-forget
```

This makes navigation near-instant after the single INSERT query completes.


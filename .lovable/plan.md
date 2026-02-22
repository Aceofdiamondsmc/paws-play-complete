

## Fix Unresponsive Send and Delete Buttons

### Problem
The code logic for `sendMessage` and `deleteConversation` is structurally correct, but the buttons appear unresponsive. Since no console errors or network failures are visible, the most likely cause is that the Realtime `postgres_changes` subscription is failing silently on channel setup (due to the earlier Realtime RLS issues), which may cause the Supabase client to enter a bad state or the `subscribe()` call to throw an unhandled promise rejection that freezes subsequent operations.

### Changes

#### 1. `src/hooks/useMessages.tsx` -- Defensive Realtime subscription + cascade delete

**sendMessage** -- Already correct (inserts into `public.messages` first, then updates `conversations`). No change needed to the order of operations.

**deleteConversation** -- There is NO foreign key cascade between `conversations` and `messages`, so the two-step delete must remain. However, swap the order: delete messages first (already done), then delete the conversation. Add a `try/catch` wrapper so an unhandled exception cannot freeze the UI.

**Realtime subscriptions** -- Wrap both channel subscriptions (in `useMessages` and `useConversationMessages`) with error-handling callbacks on `.subscribe()` to prevent silent failures from blocking the component:

```typescript
.subscribe((status, err) => {
  if (err) console.error('Realtime subscription error:', err);
});
```

#### 2. `src/components/profile/ChatView.tsx` -- Add try/catch safety

Wrap both `handleSend` and the delete handler in `try/catch` blocks so that even if Supabase throws an unexpected exception (not a returned error object), the UI will still recover and show a toast:

```typescript
const handleSend = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!newMessage.trim() || isSending) return;
  setIsSending(true);
  try {
    const { error } = await sendMessage(newMessage.trim());
    if (error) {
      console.error('Failed to send message:', error);
      toast.error(`Message failed: ${error.message}`);
      return;
    }
    setNewMessage('');
  } catch (err: any) {
    console.error('Send exception:', err);
    toast.error(`Send error: ${err?.message || 'Unknown error'}`);
  } finally {
    setIsSending(false);
  }
};
```

Same pattern for the delete onClick handler.

### Summary of files

| File | Change |
|------|--------|
| `src/hooks/useMessages.tsx` | Add error callback to `.subscribe()` on both Realtime channels; wrap `deleteConversation` in try/catch |
| `src/components/profile/ChatView.tsx` | Wrap `handleSend` and delete handler in try/catch with finally block to always reset state |


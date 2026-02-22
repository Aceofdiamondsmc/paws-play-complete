

## Fix Unresponsive Send and Delete Buttons in ChatView

### Root Cause
The `sendMessage` and `deleteConversation` functions work correctly in logic, but errors from Supabase (like RLS permission denied) are silently returned without any user-facing feedback. When `sendMessage` returns `{ error }`, the `handleSend` function only clears the input on success -- on failure it does nothing visible, making the button appear "unresponsive."

### Changes

**1. `src/components/profile/ChatView.tsx` -- Add error feedback with toast**

- Import `toast` from `sonner`
- In `handleSend`: if `sendMessage` returns an error, show a toast with the specific error message and log it to console
- In the delete handler: if `deleteConversation` returns an error, show a toast and do NOT call `onBack()` (stay on screen so user knows it failed)
- Log `console.error` in both cases for debugging

```typescript
// In handleSend:
const { error } = await sendMessage(newMessage.trim());
setIsSending(false);
if (error) {
  console.error('Failed to send message:', error);
  toast.error(`Message failed: ${error.message}`);
  return;
}
setNewMessage('');

// In delete handler:
const { error } = await deleteConversation();
if (error) {
  console.error('Failed to delete conversation:', error);
  toast.error(`Delete failed: ${error.message}`);
  return;
}
onBack();
```

**2. `src/hooks/useMessages.tsx` -- Add error logging in deleteConversation**

- Log errors from the messages delete step (currently ignored):

```typescript
const deleteConversation = async () => {
  if (!conversationId) return { error: new Error('No conversation') };
  const { error: msgError } = await supabase.from('messages').delete().eq('conversation_id', conversationId);
  if (msgError) console.error('Error deleting messages:', msgError);
  const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
  if (error) console.error('Error deleting conversation:', error);
  return { error: msgError || error };
};
```

### No database or RLS changes needed
The conversations table correctly uses `participant_1_id`/`participant_2_id`, and the hook's queries match this schema. The RLS policies for INSERT on `messages` and DELETE on both tables are already in place. The toast feedback will surface any remaining permission errors so they can be diagnosed.

### Files Modified

| File | Change |
|------|--------|
| `src/components/profile/ChatView.tsx` | Add `toast` import from sonner; show error toasts on send/delete failure |
| `src/hooks/useMessages.tsx` | Log and return errors from message deletion step |


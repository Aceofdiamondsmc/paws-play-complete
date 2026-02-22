

## Fix Chat Input Visibility and Add Delete Conversation

### Problem 1: Chat Input Hidden Behind Bottom Navigation

The `ChatView` component already has a text input and send button, but the **bottom navigation bar covers them**. Both use `z-50` and `fixed` positioning. Since the BottomNav comes later in the DOM, it renders on top of the chat input.

**Fix:** Increase the ChatView's z-index to `z-[60]` so it renders above the bottom nav, fully covering it.

### Problem 2: No "Delete / Clear Conversation" Option

There is currently no way to delete a conversation or clear its messages.

**Fix:** Add a kebab menu (three-dot icon) in the ChatView header with a "Delete Conversation" option that:
1. Deletes all messages in the conversation
2. Deletes the conversation record itself
3. Navigates back to the message list

### Problem 3: RLS Policies

Current state:
- **INSERT on messages**: Already allowed for conversation participants (multiple policies exist)
- **DELETE on messages**: Only allows `sender_id = auth.uid()` -- a user can only delete their own sent messages, not the other party's messages in a conversation
- **DELETE on conversations**: Already allowed for participants (`participant_1_id` or `participant_2_id`)

**Fix:** Add an RLS policy so participants can delete all messages in their conversations (not just their own). This is needed for the "Clear Conversation" feature. A SQL migration will add:

```sql
CREATE POLICY "Participants can delete messages in their conversations"
  ON public.messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );
```

### Changes Summary

| File | Change |
|------|--------|
| **SQL Migration** | Add DELETE policy on `messages` for conversation participants |
| `src/components/profile/ChatView.tsx` | Increase z-index to `z-[60]`; add kebab menu with "Delete Conversation" option using `DropdownMenu`; import `Trash2`, `MoreVertical` from lucide and dropdown components |
| `src/hooks/useMessages.tsx` | Add `deleteConversation` function to `useConversationMessages` that deletes all messages then the conversation record |

### Technical Details

**ChatView header changes:**
- Add a `MoreVertical` icon button in the header (right side)
- Wrap in a `DropdownMenu` with a single "Delete Conversation" item (with `Trash2` icon, destructive styling)
- On click: show confirmation via `AlertDialog`, then call `deleteConversation()`, then `onBack()`

**deleteConversation function (in useMessages.tsx):**
```typescript
const deleteConversation = async () => {
  // Step 1: Delete all messages in this conversation
  await supabase.from('messages').delete().eq('conversation_id', conversationId);
  // Step 2: Delete the conversation itself
  await supabase.from('conversations').delete().eq('id', conversationId);
};
```

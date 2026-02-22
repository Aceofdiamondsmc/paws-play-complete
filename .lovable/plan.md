

## Fix Chat Input Visibility and Add Delete Conversation

### Problem
The ChatView input/send button exists but is hidden behind the BottomNav (both at `z-50`). Additionally, there's no way to delete a conversation.

### Changes

**1. `src/components/profile/ChatView.tsx`**
- Change `z-50` to `z-[60]` on the root div (line 48) so it renders above the bottom nav
- Add `pb-20` to the messages scroll area (line 64) so the last message isn't hidden by the input
- Add a kebab menu (`MoreVertical` icon) in the header with a "Delete Conversation" option
- Import `MoreVertical`, `Trash2` from lucide and `DropdownMenu` components
- On delete: call `deleteConversation()` then `onBack()`

**2. `src/hooks/useMessages.tsx`**
- Add a `deleteConversation` function to `useConversationMessages` that:
  1. Deletes all messages: `supabase.from('messages').delete().eq('conversation_id', conversationId)`
  2. Deletes the conversation: `supabase.from('conversations').delete().eq('id', conversationId)`
- Return `deleteConversation` from the hook

**3. Database: RLS policy for message deletion**
- Current DELETE policies on `messages` only allow `sender_id = auth.uid()` (users can only delete their own sent messages)
- Need a new policy so conversation participants can delete all messages in their conversation:

```sql
CREATE POLICY "Participants can delete messages in their conversations"
  ON public.messages FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1_id = auth.uid() OR c.participant_2_id = auth.uid())
    )
  );
```

### Summary

| File | Change |
|------|--------|
| SQL Migration | Add DELETE policy on messages for conversation participants |
| `src/components/profile/ChatView.tsx` | z-index to `z-[60]`, `pb-20` on message area, add delete menu in header |
| `src/hooks/useMessages.tsx` | Add `deleteConversation` function |


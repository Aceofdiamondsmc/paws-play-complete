

## Fix Comment Editing: Use the Bottom Input Bar

The problem: inline editing replaces the comment bubble with an input field mid-scroll, forcing users to scroll to find it. It feels disconnected from the natural comment flow.

The fix: make editing work exactly like creating a new comment — use the **sticky bottom input bar**. When the user taps "Edit" on their comment, the bottom input populates with that comment's text, the Send button becomes a Save (check) button, and a small "Editing" label appears above the input. Cancel clears it and returns to normal "new comment" mode.

### Changes in `src/components/social/CommentsDrawer.tsx`

1. **Remove the inline edit UI** (lines 130-160) — comments always render in display mode
2. **Modify the bottom input bar** to serve dual purpose:
   - When `editingCommentId` is set: show the edit text, a "✓" save button, and a small "Editing · Cancel" label above the input
   - When `editingCommentId` is null: normal new comment flow (unchanged)
3. **`handleEditClick`**: sets `editingCommentId` and populates `editText` into the bottom input, auto-focuses it
4. **`handleSaveEdit`**: saves, then clears editing state
5. **`handleCancelEdit`**: clears editing state, restores empty input

This is one file, ~30 lines of net change.


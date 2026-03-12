

## Fix Comments Drawer UX (2 Issues)

### Issue 1: Comment editing feels uncontrolled
The current inline edit uses a `Textarea` that expands unpredictably inside the drawer, causing excess scrolling and a "cheap" feel. 

**Fix**: Replace the edit flow with a polished inline `Input` field that stays compact. Instead of expanding Save/Cancel buttons below, use small icon-only buttons (checkmark and X) inline next to the input — similar to how messaging apps handle inline edits. This keeps the layout tight and prevents scroll jumps.

**Changes in `CommentsDrawer.tsx`**:
- Replace `Textarea` with `Input` (single line, rounded-full to match the comment input style)
- Replace the Save/Cancel button row with two small icon-only buttons (`Check` and `X`) placed inline to the right of the input
- Remove the `space-y-2` vertical stacking — make it a single horizontal row

### Issue 2: Camera FAB visible over comments drawer
The floating camera button (`z-[100]`) in `Social.tsx` sits on top of the comments drawer since it's always rendered. When the drawer opens, it's distracting and non-functional in that context.

**Fix in `Social.tsx`**: Hide the camera FAB when the comments drawer is open by conditionally rendering it — only show when `!commentsPostId`.

### Files
| File | Change |
|------|--------|
| `src/components/social/CommentsDrawer.tsx` | Replace Textarea edit with compact inline Input + icon buttons |
| `src/pages/Social.tsx` | Hide camera FAB when `commentsPostId` is set |


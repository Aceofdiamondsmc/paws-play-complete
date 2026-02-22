

## Fix Relationship UI Across the App

### Problem
On the **Pack tab**, when a friendship status is "Pending" or "Accepted", the Message and Block buttons disappear entirely -- replaced by a static badge. Users lose access to essential actions. The "Friends" badge also lacks an unfriend option.

### RLS Policy Status
The friendships table **already has** a DELETE policy allowing either party to delete: `(requester_id = auth.uid()) OR (addressee_id = auth.uid())`. No database migration needed.

### Changes

**1. Pack.tsx -- "Pack Leader" section (lines 622-720)**

Currently the code uses an if/else chain where each friendship state returns exclusively:
- `isFriend` -> only a "Friends" badge
- `isPending` -> only a "Pending" badge  
- `isIncoming` -> Accept/Decline buttons
- default -> Add Friend + Message + Block

Replace with logic where **Message and Block are always visible** regardless of friendship status, and the friendship button changes based on state:

| Friendship State | Friendship Button | Message | Block |
|-----------------|-------------------|---------|-------|
| None | "Add Friend" | Visible | Visible |
| Pending (sent) | "Pending" badge (no action) | Visible | Visible |
| Pending (incoming) | Accept / Decline | Visible | Visible |
| Accepted | "Unfriend" (via "..." dropdown menu) | Visible | Visible |

The "Unfriend" action will use the existing `removeFriend` function from `useFriendships`, which calls `DELETE` on the friendships row. After unfriending, the UI resets to show "Add Friend".

**2. FriendsList.tsx -- rename "Remove" to "Unfriend"**

Change the "Remove" button label to "Unfriend" for clarity and consistency.

**3. Social.tsx -- no changes needed**

The Message button is already always visible for other users' posts (line 455). No friendship-conditional hiding exists here.

### Technical Details

| File | What Changes |
|------|-------------|
| `src/pages/Pack.tsx` | Refactor the Pack Leader friendship UI (lines 622-720) to always show Message and Block buttons; replace "Friends" badge with a dropdown containing "Unfriend"; import `MoreHorizontal` and `DropdownMenu` components; add `removeFriend` to the destructured `useFriendships()` return |
| `src/components/profile/FriendsList.tsx` | Rename "Remove" label to "Unfriend" (line 158) |

### No database changes required
The DELETE policy `"Users can remove friendships"` already exists on the friendships table, permitting either party to delete the row.

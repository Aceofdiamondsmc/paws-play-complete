

## Add Block/Unblock UI to Friends & Pack

Two changes: (1) add a "Blocked Users" section with tap-to-unblock, and (2) make blocking simpler with a single tap (no dialog) in the Pack tab.

### What Changes

**1. `src/hooks/useBlockedUsers.tsx` -- Return full blocked user profiles**

Currently the hook only stores a `Set<string>` of blocked IDs. We'll also fetch display_name and avatar_url from `profiles` for each blocked user, returning a `blockedUsers` array of `{ id, display_name, avatar_url }` so the UI can render them.

**2. `src/components/profile/FriendsList.tsx` -- Add "Blocked Users" section**

Add a collapsible section at the bottom of the FriendsList showing all blocked users. Each row displays their avatar, name, and a tap-to-**Unblock** button. Tapping it instantly unblocks them with a success toast. The section only appears when there are blocked users.

Also update the empty state check so the list still shows if there are blocked users even when there are no friends/requests.

**3. `src/pages/Pack.tsx` -- Simplify block to single tap**

On the Pack tab dog cards, the existing "Block" button currently opens the `BlockUserDialog`. We'll simplify this to a single tap that blocks immediately (no reason prompt) with a toast confirmation. This keeps the interaction lightweight for discovery. The full dialog with reason field remains available on the Dates tab and FriendsList for incoming requests where more context matters.

### Summary

| File | Change |
|------|--------|
| `src/hooks/useBlockedUsers.tsx` | Fetch and return blocked user profiles (name, avatar) |
| `src/components/profile/FriendsList.tsx` | Add "Blocked Users" section with tap-to-unblock buttons |
| `src/pages/Pack.tsx` | Simplify block to single-tap (no dialog) |


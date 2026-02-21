

## Fix Friend Request Cycle (Send, Accept/Decline, Re-send)

### Problems Found

1. **"Failed to send friend request"**: The `sendFriendRequest` does a plain INSERT, which fails with a duplicate key error if a friendship row already exists (e.g., previously declined request, or tapping "Add Friend" twice).

2. **No reverse-direction check**: The unique constraint is on `(requester_id, addressee_id)` only. If User A sends to User B, User B can also send to User A creating a second row -- but the UI doesn't detect the reverse direction properly.

3. **Accept/Decline already exists in FriendsList** on the Me tab, but the Pack tab shows no way to accept incoming requests -- it just shows "Pending" for both sent AND incoming requests.

### The Fix

**1. `src/hooks/useFriendships.tsx` -- Smart `sendFriendRequest`**

Before inserting, check if a friendship row already exists in either direction:
- If a **declined** row exists (in either direction), update it back to `pending` with the current user as requester
- If a **pending** row exists where the OTHER user is the requester (incoming request), auto-accept it instead (mutual interest)
- If an **accepted** row exists, do nothing (already friends)
- Only INSERT if no row exists at all

This eliminates the duplicate key error and handles all edge cases.

**2. `src/pages/Pack.tsx` -- Show "Accept" button for incoming requests**

Currently, incoming requests show the same "Pending" badge as sent requests. Update the Pack Leader section so:
- **Sent requests**: Show "Pending" badge (as now)
- **Incoming requests**: Show an "Accept" button + "Decline" button, so users can respond directly from the Pack tab without going to Me

**3. `src/components/profile/FriendsList.tsx` -- Already complete**

The FriendsList already has Accept, Decline, Remove, Block, and Unblock functionality. No changes needed here.

### Files to Change

| File | Change |
|------|--------|
| `src/hooks/useFriendships.tsx` | Rewrite `sendFriendRequest` to check for existing rows first; handle declined/reverse/duplicate cases |
| `src/pages/Pack.tsx` | Split "Pending" state into sent vs incoming; show Accept/Decline buttons for incoming requests |


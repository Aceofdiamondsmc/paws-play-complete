

## Add "Block User" Feature to the Dates Tab

### What This Does

Adds a Block button on playdate request cards so users can block harassing or unwanted requesters. Once blocked:
- All existing playdate requests from the blocked user are automatically declined
- The blocked user can no longer send new playdate requests to the blocker
- Blocked users are hidden from the Dates tab entirely

### Database Changes

#### 1. New `user_blocks` Table

| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary key |
| blocker_id | uuid | The user doing the blocking |
| blocked_id | uuid | The user being blocked |
| reason | text | Optional reason (for user's records) |
| created_at | timestamptz | When the block was created |

Unique constraint on `(blocker_id, blocked_id)` to prevent duplicate blocks. RLS policies allow users to manage only their own blocks.

#### 2. Database Function: Block Enforcement

A `security definer` function `check_user_blocked(requester uuid, receiver_owner uuid)` that checks the `user_blocks` table. This will be used in:
- **Playdate insert policy**: Prevent blocked users from creating new requests (add a check to the `playdate_requests` INSERT policy)
- **Playdate query filtering**: Filter out requests from blocked users when fetching playdates

#### 3. Block Action Function

A database function `block_user_and_decline_requests(blocker uuid, blocked uuid)` that:
1. Inserts a row into `user_blocks`
2. Declines all pending playdate requests from the blocked user to the blocker's dogs

### Frontend Changes

#### 1. New Hook: `useBlockedUsers.tsx`

- `blockUser(blockedId, reason?)` -- calls the block function, auto-declines pending requests
- `unblockUser(blockedId)` -- removes the block
- `blockedUserIds` -- Set of blocked user IDs for client-side filtering
- `isBlocked(userId)` -- quick check helper

#### 2. Updated `PlaydateCard` Component (in `Dates.tsx`)

- Add a **shield/ban icon button** on incoming playdate cards
- Tapping it opens a confirmation dialog: "Block this user? They won't be able to send you playdate requests."
- Optional reason text field
- On confirm: calls `blockUser()`, shows success toast, card disappears

#### 3. Updated `usePlaydates.tsx`

- Import blocked user IDs from the block hook
- Filter out playdates from blocked users in the returned lists
- The block check also happens server-side via RLS, so this is defense-in-depth

#### 4. Block Confirmation Dialog

A small `AlertDialog` component asking the user to confirm the block action with:
- Warning text explaining what blocking does
- Optional reason input
- Confirm / Cancel buttons

### Security Considerations

- RLS on `user_blocks` ensures users can only see/manage their own blocks
- The INSERT policy on `playdate_requests` is updated to reject requests from blocked users (server-side enforcement)
- The block+decline function uses `security definer` to update requests across ownership boundaries

### Summary of Changes

| Change | Details |
|--------|---------|
| New table | `user_blocks` with RLS |
| DB function | `block_user_and_decline_requests()` |
| DB function | `check_user_blocked()` for RLS |
| Updated RLS | `playdate_requests` INSERT checks blocks |
| New hook | `src/hooks/useBlockedUsers.tsx` |
| Updated | `src/pages/Dates.tsx` -- Block button + confirmation dialog |
| Updated | `src/hooks/usePlaydates.tsx` -- filter blocked users |


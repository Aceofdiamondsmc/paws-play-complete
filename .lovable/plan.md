

## Add Friends Feature -- Full Implementation

This plan makes the existing `useFriendships` hook actually work by fixing the missing database policies, then adds UI in the two most sensible places: an "Add Friend" button on the Pack tab's dog profile cards, and a Friends List section on the Me tab.

### Problem: Missing Database Policies

The `friendships` table currently only has a SELECT policy. The `useFriendships` hook already has `sendFriendRequest`, `acceptRequest`, `declineRequest`, and `removeFriend` functions, but they all silently fail because INSERT, UPDATE, and DELETE are blocked by RLS.

### Step 1: Database Migration -- Add Friendship RLS Policies

Add the missing policies to make the existing hook functional:

| Policy | Command | Rule |
|--------|---------|------|
| Send friend request | INSERT | `requester_id = auth.uid()` |
| Accept/decline requests | UPDATE | `addressee_id = auth.uid()` (only the recipient can respond) |
| Remove friendship | DELETE | User is either `requester_id` or `addressee_id` |

### Step 2: "Add Friend" Button on Pack Tab

The Pack tab shows discovery dog cards with a "Pack Leader" section showing the dog's owner. This is the most natural place to add a friend button -- right next to the owner's name. The button will:
- Show "Add Friend" if no friendship exists
- Show "Pending" if a request has been sent
- Show "Friends" with a checkmark if already friends
- Be hidden if viewing your own dog

### Step 3: Friends List on Me Tab

The Me tab already shows a "Friends" count card (line 325). Tapping it will expand/open a friends list section showing:
- Pending incoming requests with Accept/Decline buttons
- Current friends list with avatars, names, and a Remove option
- Sent requests showing "Pending" status

This reuses the existing `useFriendships` hook which already categorizes friendships into `friends`, `pendingRequests`, and `sentRequests`.

### Step 4: Friends Count Updates Automatically

The Me tab already displays `friends.length` from `useFriendships()` (line 325). Since the hook re-fetches after every action, the count will update automatically once the RLS policies are fixed.

---

### Technical Details

**Database migration SQL:**
```sql
-- Allow users to send friend requests
CREATE POLICY "Users can send friend requests"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (requester_id = auth.uid() AND requester_id != addressee_id);

-- Allow addressee to accept/decline
CREATE POLICY "Users can respond to friend requests"
  ON public.friendships FOR UPDATE
  TO authenticated
  USING (addressee_id = auth.uid())
  WITH CHECK (addressee_id = auth.uid());

-- Allow either party to remove friendship
CREATE POLICY "Users can remove friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (requester_id = auth.uid() OR addressee_id = auth.uid());
```

**New component: `src/components/profile/FriendsList.tsx`**
- Renders three sections: Incoming Requests, Friends, Sent Requests
- Each friend card shows avatar, name, city/state
- Accept/Decline buttons on incoming requests
- Remove button on existing friends
- Uses `useFriendships` hook directly

**Pack tab changes (`src/pages/Pack.tsx`):**
- Add an "Add Friend" / "Friends" / "Pending" button in the Pack Leader section
- Calls `useFriendships().sendFriendRequest(ownerId)` on tap
- Check existing friendship status to show the right button state

**Me tab changes (`src/pages/Me.tsx`):**
- Make the Friends stat card tappable to toggle showing `FriendsList`
- Import and render `FriendsList` component when expanded

### Summary of Files Changed

| File | Change |
|------|--------|
| New migration | Add INSERT/UPDATE/DELETE RLS policies to `friendships` |
| `src/components/profile/FriendsList.tsx` | New component for friends list UI |
| `src/pages/Pack.tsx` | Add Friend button in Pack Leader section |
| `src/pages/Me.tsx` | Tappable Friends card that shows FriendsList |

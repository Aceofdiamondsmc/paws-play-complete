

## Complete Messaging Flow: Connect Social, Dates, and Pack to Me Tab Conversations

### Current State
- The **Me tab** already has `MessageList` (shows conversations) and `ChatView` (full-screen chat) working correctly
- The `useMessages` hook has a `startConversation(otherUserId)` function ready to use
- **No other tab** currently has a way to initiate or open a conversation -- there are no "Message" buttons anywhere

### What We'll Build

**1. Add "Message" button to Friends List (`src/components/profile/FriendsList.tsx`)**
- Add a message icon button next to each accepted friend
- Clicking it calls `startConversation`, then navigates to `/me?chat={conversationId}`

**2. Add "Message" button to accepted Playdates on Dates tab (`src/pages/Dates.tsx`)**
- On booked/accepted playdate cards, add a "Message" button so users can chat with the other dog's owner
- Uses `startConversation` with the other participant's user ID

**3. Add "Message" button to Social tab post authors (`src/pages/Social.tsx`)**
- Add a small message icon in the post action bar (next to like/comment/share)
- Clicking it starts a conversation with the post author and navigates to the chat

**4. Add "Message" button on Pack tab dog cards (`src/pages/Pack.tsx`)**
- When viewing another user's dog, show a "Message" button alongside "Add Friend"
- Starts a conversation with the dog's owner

**5. Handle deep-link routing to chat on Me tab (`src/pages/Me.tsx`)**
- Support `?chat={conversationId}` query parameter so other tabs can navigate directly into a conversation
- On mount, if `chat` param exists, auto-open that conversation in `ChatView`

### Technical Details

| File | Changes |
|------|---------|
| `src/pages/Me.tsx` | Read `?chat=` query param on mount to auto-open a conversation |
| `src/components/profile/FriendsList.tsx` | Add "Message" icon button per friend; use `startConversation` + navigate |
| `src/pages/Dates.tsx` | Add "Message" button on accepted playdate cards; start conversation with other owner |
| `src/pages/Social.tsx` | Add message icon in post action bar for logged-in users viewing others' posts |
| `src/pages/Pack.tsx` | Add "Message" button on discovery dog cards next to "Add Friend" |

### Flow
1. User taps "Message" on any tab (Social, Dates, Pack, or Friends list)
2. `startConversation(otherUserId)` is called -- finds or creates a conversation row
3. App navigates to `/me?chat={conversationId}`
4. Me tab reads the query param and immediately opens `ChatView`
5. User can send/receive messages; tapping "Back" returns to the Me tab profile view

### Edge Cases Handled
- If a conversation already exists, `startConversation` returns the existing one (no duplicates)
- Users cannot message themselves (button hidden on own posts/dogs)
- Messages persist in the `messages` table with realtime subscription for live updates
- Unread counts update automatically via the existing `useMessages` hook


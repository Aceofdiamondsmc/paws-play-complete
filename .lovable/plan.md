

## Update Notifications to Use RPC Function for "Clear All"

This plan updates the notification system to use your new `mark_all_notifications_as_read` Supabase RPC function, ensuring a more efficient server-side operation.

---

### Summary of Changes

1. **Update `useNotifications.tsx`** - Replace the existing UPDATE query with an RPC call
2. **Rename button text** - Change "Mark all read" to "Clear All" for clarity
3. **Ensure immediate state refresh** - Local state updates instantly after successful RPC call

---

### Technical Details

#### 1. Update Hook to Use RPC (`src/hooks/useNotifications.tsx`)

Replace the current `markAllAsRead` function:

**Current implementation (lines 63-76):**
```typescript
const markAllAsRead = async () => {
  if (!user) return;

  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('user_id', user.id)
    .eq('read', false);

  if (!error) {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }
};
```

**New implementation using RPC:**
```typescript
const markAllAsRead = async () => {
  if (!user) return;

  const { error } = await supabase.rpc('mark_all_notifications_as_read');

  if (!error) {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }
};
```

#### 2. Update Button Text (`src/components/profile/NotificationsList.tsx`)

Change the button label from "Mark all read" to "Clear All" (line 126):

```tsx
<Button 
  size="sm" 
  variant="ghost" 
  className="text-xs h-7 gap-1"
  onClick={markAllAsRead}
>
  <Check className="w-3 h-3" />
  Clear All
</Button>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/hooks/useNotifications.tsx` | Replace UPDATE query with `supabase.rpc('mark_all_notifications_as_read')` |
| `src/components/profile/NotificationsList.tsx` | Change button text from "Mark all read" to "Clear All" |

---

### How It Works

```text
+-------------------+     +-----------------------+     +------------------+
|  User clicks      | --> |  Call Supabase RPC    | --> |  Update local    |
|  "Clear All"      |     |  mark_all_as_read     |     |  state instantly |
+-------------------+     +-----------------------+     +------------------+
                                    |
                                    v
                          +-------------------+
                          |  Database marks   |
                          |  all as read      |
                          +-------------------+
```

---

### Notes

- The RPC function runs server-side, which is more efficient than client-side UPDATE queries
- Local state (`notifications` and `unreadCount`) updates immediately after successful RPC call, so no page reload is needed
- The real-time subscription will continue to work for new incoming notifications
- If the RPC function requires parameters (like `user_id`), we may need to pass them - but typically RLS-aware functions use `auth.uid()` internally


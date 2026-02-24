

## Fix: Notifications Appearing Permanent on Me Tab

### Problem
When you tap "Clear All" on the Me tab, notifications are only marked as read -- they stay in the list forever with a dimmed style. There's no way to actually dismiss or remove them. Over time, the list grows endlessly with stale notifications.

### Solution
Make notifications behave like a proper inbox:

1. **"Clear All" actually clears** -- deletes all notifications from the database, not just marks them as read
2. **Individual dismiss** -- add an X button on each notification so users can remove one at a time
3. **Auto-hide old read notifications** -- only show the last 24 hours of read notifications; unread ones always show regardless of age

### Changes

**`src/hooks/useNotifications.tsx`**
- Add a `deleteNotification(id)` function that removes a single notification from the DB and local state
- Change `markAllAsRead` to `clearAll` -- deletes all notifications for the user from the DB and resets local state to empty
- Filter fetched notifications: show all unread + read notifications from the last 24 hours only

**`src/components/profile/NotificationsList.tsx`**
- Add an X button to each notification item for individual dismissal
- Rename "Clear All" button behavior to actually delete notifications
- Clicking a notification marks it as read (existing behavior stays)

### Technical Details

**Delete single notification:**
```tsx
const deleteNotification = async (id: string) => {
  await supabase.from('notifications').delete().eq('id', id);
  setNotifications(prev => prev.filter(n => n.id !== id));
  // update unread count if it was unread
};
```

**Clear all:**
```tsx
const clearAll = async () => {
  await supabase.from('notifications').delete().eq('user_id', user.id);
  setNotifications([]);
  setUnreadCount(0);
};
```

**24-hour read filter (in fetch):**
```tsx
// After fetching, filter out read notifications older than 24h
const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
const filtered = data.filter(n => !n.read || n.created_at > cutoff);
```

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/useNotifications.tsx` | Add `deleteNotification`, change `markAllAsRead` to delete all, add 24h read filter |
| `src/components/profile/NotificationsList.tsx` | Add X dismiss button per notification, wire up clear all to delete |


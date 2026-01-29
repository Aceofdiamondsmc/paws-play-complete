
# Fix Plan: Profile Avatar Upload and Notification Hang

## Overview

Based on my analysis, the **Edit Profile form structure already matches the reference image exactly**. No structural changes are needed. The issues are:

1. **Profile avatar uploads fail** because they target the wrong storage bucket
2. **Notifications get stuck on "Enabling..."** due to missing timeout fallback

---

## Changes Required

### 1. Fix Profile Avatar Upload Bucket

**File: `src/hooks/useProfileManagement.tsx`**

The `uploadAvatar` function currently uploads to `'post-images'` but should use `'user-profiles'`:

| Line | Current | Fixed |
|------|---------|-------|
| 47 | `.from('post-images')` | `.from('user-profiles')` |
| 53 | `.from('post-images')` | `.from('user-profiles')` |

This ensures profile photos are stored in the correct bucket (`user-profiles`) which has the proper RLS policies for user avatar storage.

---

### 2. Fix Notification "Enabling" Hang

**File: `src/components/notifications/NotificationPrompt.tsx`**

Add a timeout fallback to prevent the button from getting stuck if OneSignal fails to respond:

**Changes:**
- Add a 15-second timeout that resets `loading` state if OneSignal callback never completes
- Clear the timeout if the callback succeeds or fails normally
- This ensures the UI never gets stuck in a permanent loading state

```text
// Add timeout fallback at the start of handleEnableNotifications:
const timeoutId = setTimeout(() => {
  setLoading(false);
  toast.error('Request timed out. Please try again.');
}, 15000);

// Clear timeout in the callback's finally block and catch block
clearTimeout(timeoutId);
```

---

### 3. Pack Member Form (No Changes Needed)

The `useDogs.tsx` hook already correctly inserts into the `dogs` table (not the view):

```typescript
const { data: dog, error } = await supabase
  .from('dogs')  // ✅ Correct - inserts into table, not view
  .insert(insertData)
```

If the "cannot insert into view" error persists, it may be due to cached TypeScript types. Regenerating Supabase types should resolve this.

---

### 4. Edit Profile Form (No Changes Needed)

The form structure already matches the reference image:

| Feature | Status |
|---------|--------|
| "Edit Profile" title with X button | ✅ Matches |
| Large centered avatar with orange ring | ✅ Matches |
| Camera button overlay | ✅ Matches |
| Display Name field (full width) | ✅ Matches |
| Username field (full width) | ✅ Matches |
| City / State side by side | ✅ Matches |
| Bio textarea | ✅ Matches |
| Cancel / Save Changes buttons | ✅ Matches |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useProfileManagement.tsx` | Change bucket from `'post-images'` to `'user-profiles'` (2 locations) |
| `src/components/notifications/NotificationPrompt.tsx` | Add 15-second timeout fallback to prevent "Enabling..." hang |

---

## What This Fixes

- ✅ Profile avatar uploads will work correctly with the `user-profiles` bucket
- ✅ Notification enable button won't get stuck in loading state
- ✅ Pack member insertion should work (code is already correct)
- ✅ Edit Profile form structure remains unchanged (already matches design)

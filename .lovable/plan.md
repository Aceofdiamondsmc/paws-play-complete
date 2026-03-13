

## Fix: Same Profile Showing for All Dogs

### Root Cause

In `UserProfilePopover.tsx`, line 28: `if (profile) return;` — once a profile is fetched for the first user tapped, it's cached in state. When the user swipes to a new dog (changing `userId`), the component doesn't reset the cached profile because React reuses the same component instance. The stale profile from the first tap is shown for every subsequent dog.

### Fix — `src/components/pack/UserProfilePopover.tsx`

Add a `useEffect` that clears the cached `profile` whenever `userId` changes:

```tsx
useEffect(() => {
  setProfile(null);
}, [userId]);
```

This ensures that when the user swipes to a different dog, the next popover open will fetch the correct profile instead of reusing the stale one.

### Files Changed

| File | Change |
|------|--------|
| `src/components/pack/UserProfilePopover.tsx` | Add `useEffect` to reset `profile` state when `userId` prop changes |


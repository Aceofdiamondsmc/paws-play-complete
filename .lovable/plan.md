

# Remove Email from User Profile Display

## Overview

Remove the visible email address from the user's profile on the "Me" tab. The email is stored securely in the backend and doesn't need to be displayed on the profile view.

## Current State

The email is currently displayed in the profile header section at line 274:

```tsx
<p className="text-primary-foreground/80 text-sm">{user.email}</p>
```

This shows the user's email directly below their display name in the teal header area.

## Solution

Remove the email display line from the profile header.

## Implementation

### File: `src/pages/Me.tsx`

**Delete line 274:**

```tsx
// Remove this line:
<p className="text-primary-foreground/80 text-sm">{user.email}</p>
```

**Before (lines 272-282):**
```tsx
<div>
  <h2 className="text-xl font-bold">{profile?.display_name || 'Pet Parent'}</h2>
  <p className="text-primary-foreground/80 text-sm">{user.email}</p>
  {profile?.city && profile?.state && (
    <p className="text-primary-foreground/60 text-sm mt-1 flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      {profile.city}, {profile.state}
    </p>
  )}
</div>
```

**After:**
```tsx
<div>
  <h2 className="text-xl font-bold">{profile?.display_name || 'Pet Parent'}</h2>
  {profile?.city && profile?.state && (
    <p className="text-primary-foreground/60 text-sm mt-1 flex items-center gap-1">
      <MapPin className="w-3 h-3" />
      {profile.city}, {profile.state}
    </p>
  )}
</div>
```

## Additional Cleanup

The `Mail` icon import on line 3 is only used for the login form, so it can remain. No other changes needed.

## Summary

| File | Change |
|------|--------|
| `src/pages/Me.tsx` | Remove line 274 displaying `user.email` |


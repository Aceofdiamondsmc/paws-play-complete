

## Fix: Edit Profile Form Not Pre-filling with Existing Data

### Root Cause
`EditProfileForm` uses `useState(profile?.display_name || '')` etc. React's `useState` only uses the initial value on **first mount**. If `profile` is `null` when the dialog mounts (common due to async fetch timing), all fields initialize as empty strings and never update when profile data arrives.

### Changes

**`src/components/profile/EditProfileForm.tsx`**

- Add a `useEffect` that watches the `profile` prop and syncs all form state whenever it changes:
  ```typescript
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setCity(profile.city || '');
      setState(profile.state || '');
      setAvatarUrl(profile.avatar_url || '');
      setLocationPublic(profile.location_public !== false);
    }
  }, [profile]);
  ```
- Also re-sync when `open` changes to `true`, so re-opening the dialog always shows current data (not stale edits from a previous open).

**`src/hooks/useProfileManagement.tsx`** — Update `updateProfile` to filter out `undefined` values before sending to Supabase, ensuring only changed fields are written (partial update). Currently it spreads `...data` which can include `undefined` keys — Supabase treats those as `null`, wiping data.

No database or migration changes needed.


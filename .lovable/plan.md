
# Complete "Add to Pack" Onboarding Flow

## Summary

This plan addresses several interconnected issues to make the "Add Pack Member" flow work seamlessly as the nucleus of your app's onboarding experience:

1. Fix dog avatar uploads to use the correct `dog-avatars` bucket
2. Create an onboarding flow that collects basic profile info (display name, city/state) before adding the first dog
3. Ensure profiles are automatically created for new users
4. Mark `onboarding_completed` after the first dog is added

## Current Issues Found

| Issue | Current Behavior | Expected Behavior |
|-------|-----------------|-------------------|
| Dog avatars bucket | Uploads to `post-images` | Should use `dog-avatars` |
| Profile creation | May fail silently if profile doesn't exist | Auto-create profile on signup |
| Onboarding flow | Jumps straight to empty profile | Collect basics then add dog |
| `onboarding_completed` flag | Never set to `true` | Set after first dog added |

## Implementation Plan

### Step 1: Database - Auto-Create Profile on Signup

Create a trigger that automatically inserts a row into `profiles` when a new user signs up via Supabase Auth.

```text
SQL Migration:
┌─────────────────────────────────────────────────────────┐
│ 1. Create function handle_new_user()                   │
│ 2. Create trigger on auth.users AFTER INSERT           │
│ 3. Trigger inserts into profiles with:                 │
│    - id = user.id                                       │
│    - is_public = true                                   │
│    - onboarding_completed = false                       │
└─────────────────────────────────────────────────────────┘
```

### Step 2: Fix Dog Avatar Upload Bucket

Update `src/hooks/useDogs.tsx` to upload dog photos to the `dog-avatars` bucket instead of `post-images`.

```text
File: src/hooks/useDogs.tsx

Change:
  .from('post-images')

To:
  .from('dog-avatars')
```

### Step 3: Create Onboarding Component

Build a new `OnboardingFlow` component that appears for users where `onboarding_completed = false`. This component will:

1. **Step 1 - Profile Basics**: Collect display name, city, and state
2. **Step 2 - Add First Dog**: Present the PackMemberForm
3. **Step 3 - Mark Complete**: Set `onboarding_completed = true`

```text
User Journey:
┌──────────────┐     ┌────────────────────┐     ┌──────────────┐
│ Sign Up /    │ ──▶ │ Onboarding Flow    │ ──▶ │ Main App     │
│ First Login  │     │ (Profile + Dog)    │     │ (/social)    │
└──────────────┘     └────────────────────┘     └──────────────┘
                            │
                      ┌─────┴─────┐
                      │           │
                   Step 1      Step 2
                  "About You" "Add Pack Member"
```

### Step 4: Update Me.tsx to Show Onboarding

Modify `src/pages/Me.tsx` to detect when `onboarding_completed === false` and show the onboarding flow instead of the regular profile view.

### Step 5: Mark Onboarding Complete After First Dog

After successfully adding the first dog in the onboarding flow, update the user's profile to set `onboarding_completed = true`.

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `supabase/migrations/[new].sql` | Create | Auto-create profile trigger |
| `src/hooks/useDogs.tsx` | Modify | Use `dog-avatars` bucket |
| `src/components/profile/OnboardingFlow.tsx` | Create | New onboarding component |
| `src/pages/Me.tsx` | Modify | Show onboarding when needed |
| `src/hooks/useProfileManagement.tsx` | Modify | Add `completeOnboarding` function |

## Technical Details

### Database Trigger (Step 1)

```sql
-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, is_public, onboarding_completed, created_at, updated_at)
  VALUES (
    NEW.id,
    true,
    false,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### OnboardingFlow Component (Step 3)

The component will have a stepper UI:
- Show current step indicator (1/2)
- Step 1: Form for display name, city, state with validation
- Step 2: Embed the existing PackMemberForm
- On completion, navigate to the main app

### Onboarding Detection Logic (Step 4)

```typescript
// In Me.tsx
if (user && profile?.onboarding_completed === false) {
  return <OnboardingFlow onComplete={() => refreshProfile()} />;
}
```

## Storage Bucket Confirmation

Your `dog-avatars` bucket is correctly configured:
- Bucket is **public** (images can be viewed by anyone)
- RLS policy allows authenticated users to upload to their folder
- RLS policy allows public read access

## Expected Outcome

After implementation:

1. **New users** signing up will automatically have a profile created
2. **First visit to /me** will show a friendly onboarding flow asking for basic info
3. **Adding first dog** completes onboarding and marks `onboarding_completed = true`
4. **Dog photos** upload to the correct `dog-avatars` bucket
5. **Returning users** see their normal profile with pack members

## Optional Enhancements (Future)

- Add a progress indicator showing "Welcome to the Pack!" celebration after completing onboarding
- Allow skipping the dog addition (since you chose "Optional")
- Add profile completion percentage badge

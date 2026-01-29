
# Fix Plan: Admin Services, Sign-In Redirect, Likes/Comments Visibility & Policy Close Buttons

## Overview

This plan addresses 4 distinct issues:

1. **Admin Services Enhancement** - The page already has a "Pending Submissions" tab with Approve/Reject buttons. Need to add automatic AI image generation after approval.
2. **Sign-In Redirect Fix** - "Go to Sign In" button in SubmitService.tsx incorrectly redirects to `/` instead of `/me`
3. **Likes/Comments Visibility** - RLS policies block unauthenticated users from seeing counts
4. **Policy Modal Close Buttons** - The footer links open static HTML files in new pages (not modals) - need to convert to in-app dialogs with close buttons

---

## Issue 1: Admin Services - Automatic AI Image Generation

### Current State
- The Admin Services page already has a "Pending Submissions" tab (lines 105-141)
- The `useApproveSubmission` hook updates `approval_status` to 'approved' (lines 144-171 of useServiceSubmissions.tsx)
- A database trigger `copy_submission_to_services` already copies approved submissions to the `services` table
- The `generate-service-images` edge function supports `process_single` action with a `serviceId`

### Required Changes

**File: `src/hooks/useServiceSubmissions.tsx`**

Modify `useApproveSubmission` to trigger AI image generation after successful approval:

1. After the approval mutation succeeds, fetch the newly created service ID from the `services` table (matching on `business_name`)
2. Call the `generate-service-images` edge function with `action: 'process_single'` and the new `serviceId`
3. Show a toast indicating the image is being generated

```typescript
// In onSuccess callback:
// 1. Find the new service
const { data: newService } = await supabase
  .from('services')
  .select('id')
  .eq('name', submissionName)
  .order('id', { ascending: false })
  .limit(1)
  .single();

// 2. Trigger AI image generation
if (newService) {
  await supabase.functions.invoke('generate-service-images', {
    body: { action: 'process_single', serviceId: newService.id }
  });
}
```

---

## Issue 2: Sign-In Redirect Fix

### Current State
In `src/pages/SubmitService.tsx` line 166:
```typescript
<Button onClick={() => navigate('/')} className="w-full">
  Go to Sign In
</Button>
```

This incorrectly navigates to the landing page (`/`) instead of the Me tab (`/me`) where the login form is.

### Required Change

**File: `src/pages/SubmitService.tsx`**

| Line | Current | Fixed |
|------|---------|-------|
| 166 | `navigate('/')` | `navigate('/me')` |

---

## Issue 3: Likes/Comments Visibility for Logged-Out Users

### Current State
The RLS policies for `post_likes` and `post_comments` SELECT operations require authentication:
```sql
USING (EXISTS ( SELECT 1 FROM posts p WHERE ...))
```

These policies check `p.visibility = 'public' OR p.author_id = auth.uid()`. When `auth.uid()` is null (logged out), the query fails because RLS evaluates to false for anonymous users.

### Required Changes

**Database Migration** - Add permissive policies for anonymous reading of public post engagement data:

```sql
-- Allow anyone to read likes on public posts (for count display)
CREATE POLICY "post_likes_read_public_posts"
  ON public.post_likes FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.id = post_likes.post_id 
    AND p.visibility = 'public'
  ));

-- Allow anyone to read comments on public posts (for count display)
CREATE POLICY "post_comments_read_public_posts"
  ON public.post_comments FOR SELECT
  TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM posts p 
    WHERE p.id = post_comments.post_id 
    AND p.visibility = 'public'
  ));
```

This allows the `usePosts` hook to fetch like/comment counts even for unauthenticated users on public posts.

---

## Issue 4: Policy Modal Close Buttons

### Current State
The Landing page footer (lines 89-98) uses `<a href="/privacy.html">` links that navigate away from the app to static HTML files:
- `/privacy.html`
- `/tos.html`
- `/support.html`

Users cannot close these pages and return to the landing page easily (requires browser back button).

### Required Changes

**File: `src/pages/Landing.tsx`**

1. Add Dialog components for each policy document
2. Convert `<a>` tags to `<button>` elements that open dialogs
3. Include close (X) button in each dialog header
4. Move the content from static HTML files into React components

```typescript
// Add state for each dialog
const [showPrivacy, setShowPrivacy] = useState(false);
const [showTos, setShowTos] = useState(false);
const [showSupport, setShowSupport] = useState(false);

// Replace <a> with <button>
<button onClick={() => setShowPrivacy(true)}>Privacy Policy</button>

// Add Dialog components with X close button
<Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
  <DialogContent className="max-h-[80vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Privacy Policy</DialogTitle>
      {/* X button is built into DialogContent */}
    </DialogHeader>
    <div className="prose">
      {/* Privacy policy content */}
    </div>
  </DialogContent>
</Dialog>
```

---

## Summary of Files to Modify

| File | Change | Purpose |
|------|--------|---------|
| `src/hooks/useServiceSubmissions.tsx` | Add image generation trigger in `useApproveSubmission` | Auto-generate AI images for approved services |
| `src/pages/SubmitService.tsx` | Change `navigate('/')` to `navigate('/me')` | Fix sign-in redirect |
| `src/pages/Landing.tsx` | Convert policy links to dialogs with close buttons | Allow users to close policy views |
| Database Migration | Add anonymous SELECT policies for public post engagement | Show likes/comments to logged-out users |

---

## Technical Details

### AI Image Generation Flow
1. Admin clicks "Approve" on a submission
2. `useApproveSubmission` updates `approval_status = 'approved'`
3. Database trigger `copy_submission_to_services` copies data to `services` table
4. Modified `onSuccess` callback finds the new service ID
5. Edge function `generate-service-images` is called with `action: 'process_single'`
6. AI-generated image is uploaded to `service-images` bucket
7. Service record is updated with the new `image_url`

### Dialog Close Button
The shadcn/ui `DialogContent` component includes a built-in X button in the top-right corner by default, so no additional UI work is needed for the close functionality.

### RLS Policy Security
The new SELECT policies are permissive and only allow reading engagement data (likes/comments) on posts where `visibility = 'public'`. This maintains privacy for non-public posts while enabling social engagement visibility for public content.

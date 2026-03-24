

## Apple Review Issues - Fix Plan

There are **6 distinct issues** from Apple. Here's what each requires:

---

### Issue 1: Guideline 1.2 - User-Generated Content Safety

Apple requires these precautions for UGC apps:

**A. EULA/TOS acceptance before accessing UGC**
- Add a `tos_accepted_at` column to the `profiles` table.
- After login, if `tos_accepted_at` is null, show a mandatory EULA/TOS acceptance dialog before the user can access the Social feed or post content. The TOS text must state zero tolerance for objectionable content.
- Once accepted, save the timestamp. Do not show again.

**B. Report/Flag content mechanism**
- Add a `content_reports` table (reporter_id, post_id, reason, created_at).
- On every post in Social.tsx, add a "Report" option in a dropdown menu (visible to non-authors). The existing `MoreHorizontal` dropdown only shows for post owners currently.
- Show a confirmation toast after reporting.

**C. Block user mechanism (already exists)**
- Blocking is already implemented across Pack, Dates, and Friends. The reviewer may not have found it. We should ensure the block option is also available directly from the Social feed post menu (for non-owner posts).
- Blocking should also send a notification to the developer (admin) — add an insert into a notifications or admin alerts mechanism.

**Files changed**: `src/pages/Social.tsx`, new migration for `content_reports` table and `tos_accepted_at` column, new `src/components/social/ReportPostDialog.tsx`, `src/components/social/TOSAcceptanceDialog.tsx`

---

### Issue 2: Guideline 2.3.8 - Placeholder App Icons

This is **not a code issue** — you need to replace the app icon in Xcode/Appflow with your finalized Paws Play Repeat icon. The current `AppIcon-512@2x.png` in `ios/App/App/Assets.xcassets/AppIcon.appiconset/` likely still has the default Capacitor icon.

**Action for you**: Replace `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` with your branded 1024x1024 app icon.

---

### Issue 3: Guideline 2.1(b) - Business Model Questions

This is **not a code issue** — it's an information request. You need to reply to Apple in App Store Connect with answers to their 8 questions about your business model (free app, no paid content, Stripe subscription is optional premium, etc.).

---

### Issue 4: Guideline 2.1(a) - Demo Account Needed

**Not a code issue**. Create a demo account (email/password) and provide the credentials in the "App Review Information" section of App Store Connect. Make sure it has sample data (a dog profile, some posts) so the reviewer can explore all features.

---

### Issue 5: Guideline 5.1.1(v) - Registration Required for Non-Account Features

Apple says Parks, Services (Explore), and Shop pages require login but shouldn't. These are browsing features.

**Changes**:
- Currently all app pages are behind the `AppLayout` route group, but `AppLayout` itself doesn't enforce auth — the individual pages do via `useAuth()`. The pages Parks, Explore, Social, and Shop already render content for non-logged-in users (Social shows posts, etc.).
- The real issue: the **Landing page** redirects authenticated users but there's no way for unauthenticated users to reach the main app pages. The bottom nav and routes are inside `AppLayout` which is accessible, but the Landing page (`/`) doesn't provide navigation to browse features.
- **Fix**: Add a "Browse as Guest" or "Explore" button on the Landing page that navigates to `/parks` or `/services` without requiring login. The bottom nav already shows for all users.

**Files changed**: `src/pages/Landing.tsx`

---

### Issue 6: Guideline 5.1.1(v) - Account Deletion

Account deletion **already exists** (`Delete Account` button on the Me page, calls the `delete-account` edge function). The reviewer likely couldn't find it because they couldn't log in (Issue 4). Once you provide demo credentials, this should be resolved.

However, to be safe, we should make the Delete Account button more prominent/visible — it's currently at the bottom of the Me page.

---

### Summary of Code Changes Needed

1. **Migration**: Add `tos_accepted_at` to `profiles`, create `content_reports` table
2. **TOS Acceptance Dialog**: Shown after login, before UGC access, with zero-tolerance language
3. **Report Post**: Add report option on other users' posts in Social feed + dialog
4. **Block from Social Feed**: Add block option on other users' posts in Social feed
5. **Landing Page Guest Access**: Add "Browse as Guest" button to navigate to Parks/Services without login
6. **App Icon**: You manually replace the placeholder icon file (not a code change)
7. **Demo Account + Business Model Answers**: You provide these in App Store Connect (not code changes)

### Technical Details

- `content_reports` table: `id (uuid PK)`, `reporter_id (uuid FK profiles)`, `post_id (uuid FK posts)`, `reason (text)`, `created_at (timestamptz)`. RLS: authenticated users can insert their own reports, admins can read all.
- `tos_accepted_at` column: `timestamptz nullable` on `profiles`. Check in `Social.tsx` and post-creation flows.
- Report dialog: simple modal with reason selection (Spam, Harassment, Inappropriate Content, Other).
- Guest browsing: Landing page gets a secondary CTA "Explore Without an Account" linking to `/parks`.


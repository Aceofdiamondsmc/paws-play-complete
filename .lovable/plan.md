

## Plan: Welcome Email, Help & Support Page

Three deliverables: (1) a welcome email edge function triggered on signup, (2) a Help & Support section on the Me/Profile page, and (3) wiring it all together.

---

### 1. Welcome Email Edge Function

**New file: `supabase/functions/welcome-email/index.ts`**

- Triggered via a Supabase database webhook on `INSERT` into `profiles` (when `onboarding_completed` flips to `true`, or simply on profile creation).
- Alternative: call it from the client after onboarding completes (simpler, no webhook setup needed). The `OnboardingFlow` component's `onComplete` callback is the ideal trigger point — invoke the function there.
- The function:
  1. Receives `{ user_id }` in the request body
  2. Uses service role client to fetch `profiles` (display_name) and `dogs` (first dog's name) for that user
  3. Builds the HTML email from the template provided (warm coral brand colors, SOS button explanation, profile link)
  4. Sends via Supabase's built-in `supabase.auth.admin.sendRawEmail()` — **however**, since this project uses an external Supabase project without Lovable Cloud email, we need an email provider.

**Email delivery approach:** Since this is a transactional email (not auth), we need either:
- A Resend API key (simplest — one secret, one HTTP call)
- Or use the existing OneSignal integration to send an email notification instead

I recommend **Resend** for clean HTML email delivery. This requires adding a `RESEND_API_KEY` secret.

**`supabase/config.toml`** — add `[functions.welcome-email]` with `verify_jwt = false` (validated in-code).

**Client trigger in `src/components/profile/OnboardingFlow.tsx`** — after onboarding completes, fire-and-forget call to `supabase.functions.invoke('welcome-email', { body: { user_id } })`.

---

### 2. Help & Support Section on Profile Page

**New file: `src/components/profile/HelpSupport.tsx`**

A sheet/dialog component using the existing `Accordion` component with three sections:

1. **"How to Send a Pack Alert"** — explains SOS button, broadcast radius, printable flyer with QR code, tip about keeping photos updated
2. **"What is a Paws Alert?"** — explains community search notifications, how to contact owners securely
3. **"Managing Your Subscription"** — brief explanation + a "Manage Subscription" button that calls `useSubscription().manageSubscription()` to open Stripe portal

**Bottom section:** "Contact Support" button using `<a href="mailto:info@pawsplayrepeat.app">` styled as a full-width outlined button.

**Integration in `src/pages/Me.tsx`:**
- Add a "Help & Support" card (with `HelpCircle` icon) between the Admin Dashboard link and the Install Prompt card
- Clicking it opens the `HelpSupport` sheet
- Import the new component and add state management

---

### 3. Email Template Content

The HTML email will match the provided template exactly:
- Subject: `Welcome to the Pack! 🐾 (And how we keep your dog safe)`
- Personalized with `[User Name]` and `[Dog Name]` from the database
- Profile link: `https://pawsplayrepeat.lovable.app/me`
- Styled with the app's warm coral primary color (`hsl(24, 85%, 60%)`) for buttons/accents, white body background
- Responsive single-column layout

---

### Technical Details

| Item | File | Action |
|------|------|--------|
| Edge function | `supabase/functions/welcome-email/index.ts` | Create |
| Config | `supabase/config.toml` | Add function entry |
| Onboarding trigger | `src/components/profile/OnboardingFlow.tsx` | Add invoke call |
| Help component | `src/components/profile/HelpSupport.tsx` | Create |
| Profile page | `src/pages/Me.tsx` | Add Help & Support card + sheet |

### Prerequisite

A `RESEND_API_KEY` secret is needed for email delivery. I will ask you to add it before proceeding with the edge function.


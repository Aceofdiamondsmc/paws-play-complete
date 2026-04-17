

## Issue: Email signup failing on iOS

### Root cause

From the auth logs:
```
"451 Authentication failed: Maximum credits exceeded"
"500: Error sending recovery email"
```

Supabase's **built-in email service has hit its rate limit / credit cap**. This is a well-known limitation — Supabase's default SMTP is meant for development only and has a hard cap of ~3-4 emails/hour for the entire project. Once exhausted, ALL email-based auth (signup confirmation, password recovery) fails with a 500 error.

**Google sign-in works** because it doesn't send an email — it uses OAuth.
**Email signup fails** because Supabase can't send the confirmation email.

### Why this is biting you now

Your app is live on TestFlight and real users are signing up. The default Supabase email quota was fine during development but cannot handle production traffic.

### The fix: Set up Lovable Emails (custom auth email templates + custom sender domain)

Lovable has a built-in managed email system that:
- Removes the rate limit (uses Lovable's email infrastructure, not Supabase's tiny dev quota)
- Sends from your own domain (`notify@pawsplayrepeat.app`) instead of Supabase's default
- Includes branded templates for signup confirmation, password reset, magic link, etc.
- Works across web AND iOS (the email send is server-side, platform doesn't matter)

You already own `pawsplayrepeat.app` (it's your custom domain), so we can delegate the `notify` subdomain to Lovable's nameservers.

### Plan

**Step 1 — Set up email domain (you do this in a dialog)**
I'll present a "Set up email domain" button. You click it, choose `pawsplayrepeat.app`, and confirm. The dialog handles DNS delegation automatically.

**Step 2 — Scaffold branded auth email templates (I do this)**
After the domain is set, I'll create 6 React Email templates (signup, recovery, magic-link, invite, email-change, reauthentication) styled with your Paws Play Repeat brand colors (orange `#e87b35`, cream backgrounds, paw emoji branding to match your welcome email).

**Step 3 — Deploy the auth-email-hook edge function (I do this)**
This intercepts Supabase auth emails and routes them through Lovable's email queue, so they bypass Supabase's broken quota entirely.

**Step 4 — You monitor activation**
DNS verification can take up to 72 hours but usually completes in minutes. You can watch progress in **Cloud → Emails**. Until DNS verifies, default emails will still attempt to send (still rate-limited, but no worse than today). Once verified, all auth emails route through your domain with no quota issues.

### What does NOT need to change

- No iOS rebuild required — this is a server-side fix. Existing TestFlight users will benefit immediately once DNS verifies.
- No code changes to `useAuth.tsx` or the signup flow — the Supabase client call is unchanged. Only the email *delivery* mechanism changes.
- The native redirect scheme `com.pawsplayrepeat.app://callback` continues to work as-is.

### After fix

New iOS users tapping "Sign Up" with email will receive a branded confirmation email from `notify@pawsplayrepeat.app` within seconds, tap the link, and land back in the app via the deep-link callback — exactly as Google sign-in works today.


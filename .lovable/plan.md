
User confirms Resend SMTP signup emails arrived. Now wants to add an image/avatar (likely the app logo) to the auth confirmation email.

Context: They're on Supabase SMTP via Resend. Auth email templates are controlled in **Supabase Dashboard → Authentication → Email Templates** (HTML editor) — NOT in the codebase, because they haven't scaffolded `auth-email-hook` (the project has `auth-email-hook/deno.json` but the actual `index.ts` exists per the file listing). Wait — checking: file listing shows `supabase/functions/auth-email-hook/deno.json` AND `supabase/functions/auth-email-hook/index.ts` was shown earlier in context. So they DO have a custom auth-email-hook. But it currently routes through Lovable Emails infra (`enqueue_email`, `process-email-queue`), which they bypassed by using SendGrid/Resend SMTP directly in Supabase.

Important clarification: when they configured SMTP in Supabase dashboard, Supabase uses its own dashboard email templates and bypasses the auth-email-hook entirely. So edits to `_shared/email-templates/signup.tsx` won't apply.

So the answer: edit the Supabase dashboard email template HTML directly, add an `<img>` tag pointing to a publicly hosted logo URL (their existing `/icon-192.png` from the published site works: `https://pawsplayrepeat.app/icon-192.png`).

This is pure instructional guidance. No code changes. Keep tight.

## Plan

Tell the user:
1. Where to edit (Supabase Dashboard → Auth → Email Templates → Confirm signup)
2. Image must be hosted publicly and absolute URL — recommend their existing app icon at `https://pawsplayrepeat.app/icon-192.png`
3. Provide the exact HTML snippet to paste at top of template
4. Note email client gotchas (use width attr, alt text, no SVG)
5. Mention they need to repeat for each template type they care about (Confirm signup, Magic Link, Reset Password, etc.)

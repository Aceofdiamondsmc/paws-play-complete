
User has `system.pawsplayrepeat.app` already verified in Resend. Question: can they reuse it or need a new subdomain?

Key facts:
- Lovable Emails delegated `notify.pawsplayrepeat.app` via NS records to Lovable nameservers
- `system.pawsplayrepeat.app` is a completely different subdomain — no NS conflict
- Resend already verified it = SPF/DKIM already in place
- They can use it immediately as the SMTP sender

Answer: Yes, reuse it. No new domain needed. Just adjust the sender email in Supabase SMTP config to use `system.` instead of `mail.`.

This is purely instructional — no code changes. Keep plan tight.

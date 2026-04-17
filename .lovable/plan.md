

## Issue confirmed: email infrastructure tables are missing

I queried the database directly and there is **no `email_send_log` table** (and no related queue tables). The `auth-email-hook` edge function was deployed, but the shared queue/log infrastructure it writes to was never provisioned. So:

- No signup emails have been logged (the table doesn't exist to log them)
- The hook is likely failing silently when it tries to enqueue emails
- Supabase is probably falling back to its default SMTP — which is still rate-limited

### What needs to happen

Run **email infrastructure setup** to create the missing pieces:
- `email_send_log` table (for monitoring + dedup)
- `email_send_state`, `suppressed_emails`, `email_unsubscribe_tokens` tables
- `auth_emails` and `transactional_emails` pgmq queues
- `enqueue_email` RPC function
- `process-email-queue` pg_cron dispatcher job
- Vault secret for the service role key

This is a one-shot setup. After it runs:
- Auth emails will start flowing through the queue
- DNS for `notify.pawsplayrepeat.app` is already verified, so delivery works immediately
- I can re-query `email_send_log` to confirm signup emails are landing successfully

### Why this got missed earlier

The previous run scaffolded templates and deployed the hook function but skipped the underlying queue/migration step. The hook can't deliver mail without the queue + dispatcher behind it.

### After approval, I will

1. Run email infrastructure setup (creates tables, queues, cron, vault secret)
2. Re-deploy `auth-email-hook` to ensure it's running against the new infra
3. Query `email_send_log` and report the actual signup email status to you

No iOS rebuild required — this is entirely server-side.


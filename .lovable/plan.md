
The user can't find "Rerun Setup" in Cloud → Emails. I need to investigate the actual current state before assuming the infra is missing — my last message may have been wrong about that. Let me plan to verify status properly.

Steps:
1. Check email domain status via tool
2. Query DB for actual presence of email_send_log, queues, cron job
3. Check edge function logs for auth-email-hook to see if it's actually being invoked and what errors occur
4. Based on real findings, take the correct action (which may be: re-run setup_email_infra tool, redeploy hook, or escalate)

Key insight: the `email_domain--setup_email_infra` tool exists and is idempotent. I should run that directly rather than asking the user to click a UI button. That's the actual fix.



## Update Welcome Email Sender Domain

Simple one-line change in `supabase/functions/welcome-email/index.ts`.

**Change line 74:**
```
from: "Paws Play Repeat <welcome@pawsplayrepeat.app>"
```
to:
```
from: "Paws Play Repeat <welcome@system.pawsplayrepeat.app>"
```

This uses your already-verified Resend domain so emails will deliver immediately on the free plan.


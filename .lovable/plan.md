

## Provide Apple an Expired Trial Demo Account

### What Apple Wants
They need to see what happens when a user's free trial has expired — that the app degrades gracefully and the user can still access free features.

### Recommended Approach: Demo Override in Edge Function

Add a special case in the `check-subscription` edge function for a dedicated Apple reviewer email. When that email is detected, return an "expired trial" response. This is reliable and doesn't depend on Stripe state.

### Steps

**1. Create a new Supabase Auth user**
- Go to Supabase Dashboard > Auth > Users
- Create: `apple-expired@pawsplayrepeat.app` / password: `PawsTest2026!`
- Set up a basic profile and dog (same as your existing reviewer account)

**2. Update `check-subscription` edge function**
Add a check near the top (after user authentication) for the demo email:

```typescript
// Demo: expired trial for Apple reviewer
if (user.email === 'apple-expired@pawsplayrepeat.app') {
  return new Response(JSON.stringify({
    subscribed: false,
    status: 'expired_trial',
    trial_end: new Date(Date.now() - 86400000).toISOString(), // expired yesterday
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
```

No other code changes needed — the `FreeTrialBanner` component already shows the "Start Your Free Trial" CTA when `isSubscribed` is false, which is the correct expired-trial experience.

**3. Provide Apple both accounts in the review notes**

| Account | Email | Password | Purpose |
|---|---|---|---|
| Active trial | apple-tester@pawsplayrepeat.app | PawsTest2026! | Full premium access |
| Expired trial | apple-expired@pawsplayrepeat.app | PawsTest2026! | Shows post-trial experience |

### What the Reviewer Will See (Expired Account)
- All free features work normally (Parks, Social, Pack, S.O.S.)
- Services tab shows the "1st Month Free" trial banner instead of premium status
- "Add Your Service" flow still accessible (payment required at checkout)
- No content is locked or broken

### Changes
| Change | Type |
|---|---|
| Add demo email check in `check-subscription` | Edge function update (auto-deployed) |
| Create `apple-expired@pawsplayrepeat.app` user | Manual in Supabase dashboard |
| No frontend code changes | — |
| No iOS build needed | — |


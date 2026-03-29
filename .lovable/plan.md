

## Fix: Remove Stripe Fallback on Native iOS

**File: `src/hooks/useSubscription.tsx`** (lines 77-111)

The `startTrial` function currently falls through to Stripe checkout when native IAP fails. This must be removed — on native, IAP is the only purchase path.

### Change

Replace the `startTrial` function so that:
- **Native**: calls `iap.purchaseByType(type)` only. If it fails, shows an error toast. No Stripe fallback.
- **Web**: calls Stripe `create-trial-checkout` as before.

```typescript
const startTrial = async (type: 'monthly' | 'annual' = 'monthly') => {
  if (!user) {
    toast.error('Please sign in first');
    return;
  }

  if (iap.isNative) {
    const result = await iap.purchaseByType(type);
    if (result === 'error') {
      toast.error('Purchase failed. Please try again.');
    }
    return; // Never fall through to Stripe on native
  }

  // Web only — Stripe checkout
  try {
    const { data, error } = await supabase.functions.invoke('create-trial-checkout');
    if (error) throw error;
    if (data?.url) {
      window.location.href = data.url;
    }
  } catch (err: any) {
    toast.error(err.message || 'Failed to start trial');
  }
};
```

One file, one function. The Stripe fallback is fully removed from the native path.


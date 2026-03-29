

## Activate App Store Badge on Landing Page

**File: `src/pages/Landing.tsx`** (lines 130-146)

1. Delete line 132: `<p className="text-xs text-muted-foreground mb-1">Coming Soon</p>`
2. Remove `opacity-60 pointer-events-none` from the `<a>` tag's className on line 137

The badge becomes a live, clickable link to the App Store. No other files affected.


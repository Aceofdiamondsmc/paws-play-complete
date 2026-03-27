

## Update RevenueCat API Key

Replace the placeholder key in `src/hooks/useIAP.tsx` line 10 with the correct public API key.

### Change

| File | Line | Change |
|---|---|---|
| `src/hooks/useIAP.tsx` | 9-10 | Remove TODO comment, set key to `appl_VwKCwgyesJPBdIJoFPzlvxwZowm` |

This is the correct key format (`appl_` prefix = RevenueCat public Apple key, safe for client code).

Single line change, no other files affected.


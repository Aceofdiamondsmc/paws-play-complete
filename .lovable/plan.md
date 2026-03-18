

## Fix: Actually add the prebuild script to package.json

The `prebuild` line was never written to `package.json`. The scripts block currently has no reference to `generate-sounds.js`.

### Change

**`package.json`** line 8 — insert `"prebuild": "node scripts/generate-sounds.js",` before the `"build"` entry.

Everything else is done:
- `scripts/generate-sounds.js` exists and generates all 4 `.wav` files
- All 7 Edge Functions correctly reference `paws_happy`, `paws_reminder`, `paws_urgent`, `paws_alert`
- `alert-sounds.ts` handles in-app Web Audio synthesis

After this one-line fix, the feature is complete.


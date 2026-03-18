

## Fix: Add prebuild script to package.json

### Problem
The `prebuild` script that auto-generates notification sound `.wav` files was planned but never actually added to `package.json`. Without it, Appflow builds won't have the sound files in the native directories.

### Change

**`package.json`** — Add one line to the `scripts` block:

```json
"prebuild": "node scripts/generate-sounds.js",
```

This goes right before the existing `"build"` entry. npm automatically runs `prebuild` before `build`, so every Appflow build will generate and copy the 4 `.wav` files to `ios/App/App/` and `android/app/src/main/res/raw/` with zero manual steps.


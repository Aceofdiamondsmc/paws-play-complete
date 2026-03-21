

## Plan: Park review alphabetical sort + native sound prebuild script

### Part 1: Sort parks alphabetically in review picker

**File**: `src/components/social/CreatePostForm.tsx` (line 214)

Replace:
```tsx
allParks.map((park) => (
```
With:
```tsx
[...allParks].sort((a, b) => a.name.localeCompare(b.name)).map((park) => (
```

This only affects the review picker dropdown. The Parks tab list/map remains sorted by rating/proximity.

### Part 2: Add prebuild script to package.json

**File**: `package.json` (line 13, after `"test:watch"`)

Add:
```json
"prebuild": "node scripts/generate-sounds.js"
```

The `scripts/generate-sounds.js` file already exists and generates 4 `.wav` files (`paws_reminder`, `paws_urgent`, `paws_alert`, `paws_happy`), copying them to both `ios/App/App/` and `android/app/src/main/res/raw/`.

### After code changes -- terminal steps

```bash
git pull origin main
npm run prebuild
npx cap sync ios
```

Then rebuild via Appflow. The edge functions already reference the correct sound filenames -- they just need the files to exist in the native bundle.

### Risk assessment

- Part 1: Zero risk. Read-only sort on a shallow copy. No other component uses this dropdown.
- Part 2: Zero risk to existing logic. Only adds a new npm script entry. The generate script creates files in native directories that are currently empty.


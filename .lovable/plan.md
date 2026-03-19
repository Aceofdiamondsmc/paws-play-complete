

## Fix: Downgrade @capacitor/filesystem to match Capacitor 6

### Problem
The Appflow build failed because `@capacitor/filesystem@8.1.2` requires `@capacitor/core >= 8.0.0`, but the project runs Capacitor 6. All other Capacitor plugins in the project are pinned to `^6.0.0`.

### Fix
Change `@capacitor/filesystem` from `^8.1.2` to `^6.0.0` in `package.json`. The Capacitor 6 version of Filesystem has the same API (`writeFile`, `Directory.Cache`, etc.) so no code changes are needed in `LostDogAlertModal.tsx`.

### File Changed
- `package.json` — Change `"@capacitor/filesystem": "^8.1.2"` to `"@capacitor/filesystem": "^6.0.0"`

### After Implementation
1. Pull changes
2. Run `npm install`
3. Run `npx cap sync`
4. Push to GitHub and trigger Appflow build


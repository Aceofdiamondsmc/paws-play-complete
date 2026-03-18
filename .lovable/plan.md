

## Get Custom Notification Sounds Working Without Local Commands

### The Problem
The `scripts/generate-sounds.js` exists but was never executed. No sound files exist in `ios/App/App/` or `android/app/src/main/res/raw/`. The Edge Functions already reference `.caf` files that don't exist, so push notifications silently fall back to the default sound.

### The Fix (two parts)

**Part 1: Change iOS sound references from `.caf` to `.wav`**

iOS supports `.wav` files for notification sounds (up to 30 seconds, PCM format). This eliminates the need for `afconvert` entirely. Update all 7 Edge Functions to use `.wav` instead of `.caf`:
- `paws_happy.caf` → `paws_happy.wav`
- `paws_reminder.caf` → `paws_reminder.wav`
- `paws_urgent.caf` → `paws_urgent.wav`
- `paws_alert.caf` → `paws_alert.wav`

Files to update:
- `supabase/functions/care-reminder-push/index.ts`
- `supabase/functions/lost-dog-alert/index.ts`
- `supabase/functions/comment-notification/index.ts`
- `supabase/functions/like-notification/index.ts`
- `supabase/functions/message-notification/index.ts`
- `supabase/functions/friend-request-notification/index.ts`
- `supabase/functions/send-test-notification/index.ts`

**Part 2: Generate and commit the `.wav` files directly**

Since Lovable can't run Node scripts, I'll port the sound synthesis logic from `generate-sounds.js` into a self-contained approach: write the raw PCM WAV binary data and commit the files directly to:
- `ios/App/App/paws_happy.wav`, `paws_reminder.wav`, `paws_urgent.wav`, `paws_alert.wav`
- `android/app/src/main/res/raw/paws_happy.wav`, `paws_reminder.wav`, `paws_urgent.wav`, `paws_alert.wav`

I'll encode the WAV files as base64 strings embedded in a small helper script that writes them out, or more practically, I'll create the binary content using the same synthesis math from `generate-sounds.js` and write the files.

**Reality check:** Lovable's file write tool works with text content, not binary. I cannot write binary `.wav` files directly.

### Revised Approach

The most practical path:

1. **Update `generate-sounds.js`** to automatically copy outputs to the correct iOS and Android directories (no manual steps)
2. **Update Edge Functions** to use `.wav` instead of `.caf` (iOS supports WAV natively)
3. **You run one command** on your Mac: `node scripts/generate-sounds.js` — the script handles everything else

That's it — one command instead of five.

### Technical Details

**`scripts/generate-sounds.js`** — add auto-copy at the end:
```javascript
// After generating WAV files, copy to native directories
const iosDir = path.join(__dirname, '..', 'ios', 'App', 'App');
const androidDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'raw');
// Create dirs if needed, copy all .wav files to both locations
```

**Edge Functions** — find/replace `.caf` → `.wav` in all 7 files.

### What You Do After
```
git pull
node scripts/generate-sounds.js
npx cap sync
git add . && git commit -m "Add custom notification sounds"
git push
```

Appflow will bundle the sound files on next build.


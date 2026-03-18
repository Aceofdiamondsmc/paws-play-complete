

## Add Dog-Themed Custom Notification Sounds for iOS

### What Changes

Update all 7 Edge Functions that send OneSignal push notifications to reference custom iOS sound files instead of `'default'`. Also add matching Android sound references.

### Sound Mapping

| Sound File | Used By | Vibe |
|---|---|---|
| `paws_happy.caf` | like, comment, friend request, message, reunited | Playful yip + jingle |
| `paws_reminder.caf` | care reminders (feeding, grooming, walks, training, vet, birthday) | Double-bark + bell |
| `paws_urgent.caf` | care reminders (medication category) | Whimper + double bell |
| `paws_alert.caf` | lost dog alert | Bark + rising siren |

### Edge Function Changes (7 files)

**`care-reminder-push/index.ts`** (lines 157-158)
- Change `ios_sound: 'default'` to conditional: if `reminder.category === 'medication'` use `paws_urgent.caf`, otherwise `paws_reminder.caf`
- Change `android_sound` similarly: `paws_urgent` or `paws_reminder`

**`lost-dog-alert/index.ts`**
- Missing/urgent template: add `ios_sound: 'paws_alert.caf'`, `android_sound: 'paws_alert'`
- Reunited template: add `ios_sound: 'paws_happy.caf'`, `android_sound: 'paws_happy'`

**`comment-notification/index.ts`** (line 138 payload)
- Add `ios_sound: 'paws_happy.caf'`, `android_sound: 'paws_happy'`, `priority: 10`

**`like-notification/index.ts`** (payload around line 126)
- Add `ios_sound: 'paws_happy.caf'`, `android_sound: 'paws_happy'`, `priority: 10`

**`message-notification/index.ts`** (payload around line 92)
- Add `ios_sound: 'paws_happy.caf'`, `android_sound: 'paws_happy'`, `priority: 10`

**`friend-request-notification/index.ts`** (payload around line 108)
- Add `ios_sound: 'paws_happy.caf'`, `android_sound: 'paws_happy'`, `priority: 10`

**`send-test-notification/index.ts`** (payload around line 85)
- Add `ios_sound: 'paws_reminder.caf'`, `android_sound: 'paws_reminder'`, `priority: 10`

### Sound File Generation Script

Create `scripts/generate-sounds.js` that uses `OfflineAudioContext` (Node.js compatible) to render the 4 existing Web Audio patterns from `alert-sounds.ts` into `.wav` files:
- `playReminderSound()` → `paws_reminder.wav`
- `playUrgentSound()` → `paws_urgent.wav`
- `playPackAlertSound()` → `paws_alert.wav`
- `playReunitedSound()` → `paws_happy.wav`

### Capacitor/Appflow Integration (post-implementation steps for you)

Since you use Appflow (not Xcode directly):

1. Run `node scripts/generate-sounds.js` to generate `.wav` files
2. Convert to iOS format: `afconvert paws_happy.wav ios/App/App/paws_happy.caf -d ima4 -f caff` (repeat for all 4)
3. The `.caf` files committed in `ios/App/App/` will be picked up automatically by Capacitor during `npx cap sync ios` and included in the Appflow build — no Xcode project file editing needed
4. For Android: place `.wav` files (renamed without extension or as `.mp3`) in `android/app/src/main/res/raw/` (e.g., `paws_happy.mp3`)
5. Deploy updated edge functions via Supabase CLI
6. Appflow will bundle the sound files on next cloud build


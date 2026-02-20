
## Fix Background Push Notifications — Add Missing Service Worker File

### Current State

`public/OneSignalSDKWorker.js` already exists and contains exactly the right line:
```js
importScripts("https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js");
```

`public/OneSignalSDKUpdaterWorker.js` does **not exist**. This is the missing piece. OneSignal registers two service worker files — the updater worker handles silently upgrading the SDK in the background, and its absence means background push cannot be received when the app is closed.

### What Will Be Done

Create one new file:

| File | Content |
|---|---|
| `public/OneSignalSDKUpdaterWorker.js` | `importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');` |

`OneSignalSDKWorker.js` will **not be touched** — it is already correct.

### Why Both Files Are Needed

OneSignal's Web Push SDK v16 registers **two** service workers when a user grants permission:

- `OneSignalSDKWorker.js` — the active push listener (handles incoming notifications)
- `OneSignalSDKUpdaterWorker.js` — the background updater (keeps the SDK fresh without user interaction)

If the updater worker file returns a 404, browsers may fail to complete service worker installation entirely, silently breaking background push delivery even when the app is closed.

### No Other Changes Needed

- `index.html` already loads the OneSignal page SDK correctly
- `OneSignal.login(user.id)` is already called on sign-in
- `channel_for_external_user_ids: 'push'` is already in both notification payloads
- `manifest.json` is already configured correctly for PWA

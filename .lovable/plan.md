

## Update OneSignalSDKWorker.js with Immediate Activation Hooks

**What**: Add `install` and `activate` event listeners to the OneSignal service worker so it activates immediately without waiting for a page refresh.

**Why**: By default, a new service worker waits until all tabs are closed before activating. Adding `skipWaiting()` and `clients.claim()` ensures the worker takes control instantly, improving reliability of background push notifications -- especially on iOS PWAs.

### Changes

**File: `public/OneSignalSDKWorker.js`**

Replace the current single-line content with:

```js
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
```

This is a small addition to one file -- the existing `importScripts` line stays at the bottom.


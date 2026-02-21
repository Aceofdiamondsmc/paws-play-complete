self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

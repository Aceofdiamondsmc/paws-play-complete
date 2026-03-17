

## Move OneSignal Bell Widget to Top of Page

The small red bell icon at the bottom-right of the landing page is the **OneSignal SDK's built-in bell widget** (called "Slide Prompt" or "Bell Prompt"). It's injected automatically by the OneSignal SDK initialized in `index.html`, not by any React component.

### Option A: Move it to the top-right
Update the OneSignal `init` call in `index.html` to configure the bell's position:

```js
await OneSignal.init({
  appId: "47e18c4a-2002-4fec-9e3a-4984745e7cd5",
  notifyButton: {
    enable: true,
    position: 'top-right',
    offset: { bottom: '0px', right: '16px', top: '16px', left: '0px' },
  },
});
```

### Option B: Disable the OneSignal bell entirely (recommended)
Since you already have a custom `NotificationPrompt` component that handles permission requests with better UX, the OneSignal bell is redundant. Disable it:

```js
await OneSignal.init({
  appId: "47e18c4a-2002-4fec-9e3a-4984745e7cd5",
  notifyButton: { enable: false },
});
```

### Recommendation
**Option B** is cleaner — your custom `NotificationPrompt` already handles the permission flow with branded UI. The OneSignal bell is a generic widget that overlaps your footer and adds visual clutter. Disabling it keeps the UX consistent.

### Change
- **`index.html`** (line 10-13): Add `notifyButton: { enable: false }` to the OneSignal init config.


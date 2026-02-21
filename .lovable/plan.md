

## Show iOS Install Card on All Devices (Not Just iOS)

**Problem**: The `IOSInstallCard` component currently checks `if (dismissed || !isIOS() || isStandalone()) return null;` -- meaning it only shows on iOS Safari when NOT installed as a PWA. On any other device (desktop, Android, or already-installed PWA), it's completely hidden.

**Solution**: Remove the iOS-only gate so the card always appears at the bottom of the Me tab (still dismissible). This matches the uploaded screenshot -- a persistent prompt encouraging users to install the app.

### Changes

**File: `src/pages/Me.tsx`** (line 477)

Update the guard condition in `IOSInstallCard` from:

```js
if (dismissed || !isIOS() || isStandalone()) return null;
```

to:

```js
if (dismissed || isStandalone()) return null;
```

This keeps the card hidden if:
- The user dismissed it (7-day localStorage suppression)
- The app is already installed as a PWA (standalone mode)

But it will now show on **all devices/browsers**, not just iOS Safari. The content already matches the uploaded screenshot (Share icon, step-by-step instructions, dismiss X button).

### Optional Enhancement

If you'd like the card text to adapt per platform (e.g., different instructions for Android vs iOS), that can be a follow-up. For now this shows the same iOS-focused instructions to everyone, which is fine since the primary target audience is iPhone users browsing in Safari.


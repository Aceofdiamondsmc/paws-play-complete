

## Context

On the **web**, file inputs (`<input type="file">`) are handled entirely by the browser/OS. The browser does **not** trigger a permissions prompt for picking a photo from the gallery -- it just opens the file picker. For the camera (`capture="environment"`), some mobile browsers show a camera permission prompt, but desktop browsers typically just open a file dialog. This is standard browser behavior and **cannot be changed from JavaScript** for file inputs.

However, for **App Store compliance** (especially iOS/Android via Capacitor), you likely want explicit permission requests. The proper way to handle this is:

### What's NOT fixable (web limitation)
- **Photo/Video (gallery) picker**: Browsers never ask permission to open a file picker. There is no web API to request "photo library" permission. This is by design -- the user is actively choosing a file, which is considered consent.

### What IS fixable
- **Camera button**: We can use the [Permissions API](https://developer.mozilla.org/en-US/docs/Web/API/Permissions_API) to **query** camera permission status, and `getUserMedia` to **trigger** the browser's permission prompt -- but we must do it carefully to avoid breaking the file input click (the previous bug).

### Proposed approach

1. **Camera button**: Use a two-step flow. First tap checks permission status via `navigator.permissions.query({ name: 'camera' })`. If `"prompt"` or `"denied"`, show a custom confirmation dialog ("This app needs camera access to take photos. Allow?") with a button that calls `getUserMedia` to trigger the native prompt. After permission is granted, the dialog closes and the user taps Camera again (now it just opens the file input directly). If already `"granted"`, skip straight to the file input.

2. **Photo/Video button**: No change possible -- browsers handle this natively. We could add a brief info toast on first use ("Photos you select are uploaded to share with the pack") for transparency, but there's no permission to request.

### Alternative simpler approach (recommended)

Since the previous `getUserMedia` approach broke the gesture chain, and the Permissions API has limited browser support, the **most practical solution** is:

- **Camera**: Show a custom in-app dialog on first tap explaining "Paws Play needs camera access to take photos." with a "Continue" button. When tapped, open the file input. The OS/browser will then show its native camera permission prompt. Store a flag in `localStorage` so this dialog only appears once.
- **Photo/Video**: Same pattern -- show an in-app dialog on first use: "Paws Play will upload photos you select." Continue opens the picker. One-time only.

This gives you a clear permission-like UX without fighting browser APIs.

### Changes
- **`PhotoUploadSheet.tsx`**: Add state for showing permission dialogs, check `localStorage` for first-use flags, show AlertDialog before opening file inputs on first use.




## Enable iOS Web Push with "Add to Home Screen" Prompt

This plan adds iOS-specific detection and an instructional prompt that guides Safari users to add the app to their home screen, which is required for web push notifications on iOS.

---

### Background

On iOS, web push notifications only work when:
1. The app is added to the home screen (runs in "standalone" mode)
2. The user is on iOS 16.4+ with Safari
3. A valid Web App Manifest is present

---

### Summary of Changes

| Step | Description |
|------|-------------|
| 1 | Create PWA manifest.json with required iOS properties |
| 2 | Add manifest link and iOS-specific meta tags to index.html |
| 3 | Create utility functions for iOS and standalone mode detection |
| 4 | Update NotificationPrompt to show iOS-specific "Add to Home Screen" instructions |
| 5 | Add localStorage tracking to not repeatedly show the prompt |

---

### Step 1: Create PWA Manifest

Create `public/manifest.json` with properties required for iOS PWA support:

```json
{
  "name": "Paws Play Repeat",
  "short_name": "PawsPlay",
  "description": "Connect with fellow pet parents",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1a1f2e",
  "theme_color": "#4ECDC4",
  "icons": [
    {
      "src": "/favicon.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/favicon.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

### Step 2: Update index.html

Add manifest link and iOS-specific meta tags:

```html
<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json" />

<!-- iOS PWA Support -->
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="PawsPlay" />
```

---

### Step 3: Add Detection Utilities

Update `src/lib/navigation-utils.ts` with new helper functions:

```typescript
/**
 * Check if running as installed PWA (standalone mode)
 */
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

/**
 * Check if iOS Safari (not Chrome/Firefox on iOS)
 */
export function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua);
  const isWebkit = /WebKit/.test(ua);
  const isChrome = /CriOS/.test(ua);
  const isFirefox = /FxiOS/.test(ua);
  return isIOS && isWebkit && !isChrome && !isFirefox;
}
```

---

### Step 4: Update NotificationPrompt Component

Modify `NotificationPrompt.tsx` to handle three scenarios:

```text
+------------------+     +---------------------+     +-------------------+
|  User on iOS     | --> |  Running as PWA?    | --> |  Show normal      |
|  Safari?         |     |  (standalone mode)  |     |  notification     |
+------------------+     +---------------------+     |  prompt           |
        |                         |                  +-------------------+
        | No                      | No
        v                         v
+------------------+     +---------------------+
|  Show normal     |     |  Show "Add to       |
|  notification    |     |  Home Screen"       |
|  prompt          |     |  instructions       |
+------------------+     +---------------------+
```

**New prompt UI for iOS Safari users not in standalone mode:**

- Title: "Get Notifications on iPhone"
- Message: "Add this app to your home screen to receive push notifications"
- Visual step-by-step instructions:
  1. Tap the Share button (icon shown)
  2. Scroll down and tap "Add to Home Screen"
  3. Tap "Add" to confirm
- Dismiss button saves to localStorage to not show again for 7 days

---

### Step 5: Component State Logic

```typescript
// New state to track prompt type
const [promptType, setPromptType] = useState<'standard' | 'ios-install' | null>(null);

useEffect(() => {
  if (user && profile && !profile.onesignal_player_id) {
    const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
    const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    
    // Check if iOS Safari but NOT standalone
    if (isIOSSafari() && !isStandalone()) {
      // Don't show if dismissed within 7 days
      if (Date.now() - dismissedAt > sevenDays) {
        setTimeout(() => setPromptType('ios-install'), 3000);
      }
    } else {
      // Non-iOS or already standalone - show standard prompt
      setTimeout(() => setPromptType('standard'), 3000);
    }
  }
}, [user, profile]);
```

---

### iOS Install Prompt UI

```tsx
{promptType === 'ios-install' && (
  <Card className="p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
        <Share className="w-5 h-5 text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-sm">Get Notifications on iPhone 📲</h3>
        <p className="text-xs text-muted-foreground mt-1">
          Add this app to your home screen to receive alerts:
        </p>
        <ol className="text-xs text-muted-foreground mt-2 space-y-1.5 list-decimal list-inside">
          <li>Tap <Share className="inline w-3 h-3 mb-0.5" /> at the bottom of Safari</li>
          <li>Scroll and tap <span className="font-medium">"Add to Home Screen"</span></li>
          <li>Tap <span className="font-medium">"Add"</span> to confirm</li>
        </ol>
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full text-xs h-8 mt-3"
          onClick={handleDismissIOSPrompt}
        >
          Got it
        </Button>
      </div>
      <button onClick={handleDismissIOSPrompt} className="text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  </Card>
)}
```

---

### Files to Create/Modify

| File | Action | Description |
|------|--------|-------------|
| `public/manifest.json` | Create | PWA manifest for iOS home screen support |
| `index.html` | Modify | Add manifest link and iOS meta tags |
| `src/lib/navigation-utils.ts` | Modify | Add isStandalone() and isIOSSafari() functions |
| `src/components/notifications/NotificationPrompt.tsx` | Modify | Add iOS detection and install instructions UI |

---

### Technical Notes

- The `display: standalone` in manifest is required for iOS to treat it as a PWA
- `(window.navigator as any).standalone` is iOS-specific and indicates home screen install
- localStorage tracking prevents annoying users who dismiss the prompt
- The Share icon from lucide-react matches iOS Safari's share button
- OneSignal handles the actual push subscription once the PWA is installed


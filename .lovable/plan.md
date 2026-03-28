

## Fix: Hide iOS Install Prompt on Native App

### Risk
Apple Review Guideline 2.5.6 prohibits native apps from instructing users to install via Safari/"Add to Home Screen." Showing this prompt inside the native app shell could trigger a rejection.

### What Changes

**File: `src/pages/Me.tsx`**

1. Add a native platform check near the top of the component:
```tsx
const isNativePlatform = !!(window as any).Capacitor?.isNativePlatform?.();
```

2. Update line 661 to include the guard:
```tsx
{!installDismissed && !isNativePlatform && (
```

That is the only change. One file, two lines.

### Why This Is Safe
- Uses the same detection pattern already proven in `NotificationPrompt.tsx`
- No native build required for the web/PWA version to update immediately
- The native app will get this fix in the next successful Appflow build (which we are already working on)
- No risk of breaking existing behavior -- the prompt simply stops rendering when `Capacitor.isNativePlatform()` returns true


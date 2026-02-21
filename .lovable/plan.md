

## Make Install Prompt Always Visible on the Me Tab

**Problem**: The `IOSInstallCard` component is hidden because `isStandalone()` returns `true` inside the Lovable preview iframe (and possibly on deployed standalone PWAs too). Every conditional gate we've tried has hidden it.

**Solution**: Remove the `IOSInstallCard` component entirely and inline the install prompt directly in the Me tab's authenticated view. No `isIOS()` check, no `isStandalone()` check. Just a simple, always-visible, dismissible card with the install instructions.

### Changes

**File: `src/pages/Me.tsx`**

1. **Replace the `<IOSInstallCard />` reference (line 419)** with the card content rendered inline, using a simple `useState` + `localStorage` dismiss pattern directly in the `Me` component (no separate function that could have its own conditional logic).

2. **Remove the standalone `IOSInstallCard` function** (lines 463-509) since it's no longer needed.

3. **The inline card will**:
   - Always render unless the user explicitly dismissed it (7-day localStorage suppression)
   - Show a Share icon, title "Get Notifications on iPhone", and the 3-step instructions
   - Have an X button to dismiss
   - Match the uploaded screenshot style

### Technical Detail

In the `Me` component's authenticated return block, replace:
```jsx
{/* iOS Install Prompt */}
<IOSInstallCard />
```

With a state variable `installDismissed` (checked from localStorage on mount) and inline JSX:
```jsx
{!installDismissed && (
  <Card className="p-4 relative">
    <button onClick={dismissInstall} className="absolute top-3 right-3 ...">
      <X className="w-4 h-4" />
    </button>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-primary/10 ...">
        <Share className="w-5 h-5 text-primary" />
      </div>
      <div>
        <h3 className="font-bold text-sm">Get Notifications on iPhone</h3>
        <p>Install this app to your Home Screen to receive push notifications.</p>
        <ol>
          <li>Tap the Share button in Safari</li>
          <li>Scroll down and tap "Add to Home Screen"</li>
          <li>Tap "Add" in the top right</li>
        </ol>
      </div>
    </div>
  </Card>
)}
```

The key difference: **zero platform detection checks**. The card shows for everyone unless manually dismissed.


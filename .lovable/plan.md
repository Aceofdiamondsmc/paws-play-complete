

## Fix iOS Native Issues

Three changes are needed:

### 1. Fix build error in Social.tsx — Add missing `Navigate` import
Line 228 uses `<Navigate to="/" replace />` but `Navigate` is not imported from `react-router-dom`. The import on line 2 only has `useNavigate`. Add `Navigate` to that import.

The audio unlock `useEffect` already exists (lines 194-210), so no changes needed there.

### 2. Add native push notification request in App.tsx
Add a `useEffect` in the `App` component that:
- Dynamically imports `@capacitor/push-notifications` (same pattern as the existing Capacitor import to avoid build errors)
- Checks if running on a native platform
- Calls `requestPermissions()` then `register()` if granted
- This triggers the native iOS permission popup on app launch

### 3. Increment CFBundleVersion in Info.plist
Change `<string>51</string>` to `<string>52</string>` on the CFBundleVersion line.

### Technical Details

**Social.tsx line 2:**
```typescript
import { useNavigate, Navigate } from 'react-router-dom';
```

**App.tsx — new useEffect** (after existing useEffect, ~line 69):
```typescript
useEffect(() => {
  const requestNativePush = async () => {
    try {
      const native = (window as any).Capacitor?.isNativePlatform?.();
      if (!native) return;
      const { PushNotifications } = await import('@capacitor/push-notifications');
      const result = await PushNotifications.requestPermissions();
      if (result.receive === 'granted') {
        await PushNotifications.register();
      }
    } catch (e) {
      console.warn('Push permission request failed:', e);
    }
  };
  requestNativePush();
}, []);
```

**Info.plist:** `51` → `52`


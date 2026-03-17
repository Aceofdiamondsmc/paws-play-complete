

## Plan: Add iOS Permission Keys and Capacitor Native Plugins

### Problem
The TestFlight build doesn't prompt for permissions because `Info.plist` is missing the required `NS*UsageDescription` keys. Additionally, no Capacitor native plugins (`@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/push-notifications`) are installed.

### Changes

#### 1. Update `ios/App/App/Info.plist`
Add the following keys before the closing `</dict>`:

| Key | Value |
|-----|-------|
| `NSLocationWhenInUseUsageDescription` | Paws Play Repeat uses your location to show nearby dog parks and pet services. |
| `NSCameraUsageDescription` | Paws Play Repeat needs camera access so you can take and share photos of your pets. |
| `NSPhotoLibraryUsageDescription` | Paws Play Repeat needs access to your photo library so you can share pet photos. |
| `NSPhotoLibraryAddUsageDescription` | Paws Play Repeat would like to save photos to your library. |

#### 2. Update `ios/App/App/AppDelegate.swift`
Import `UserNotifications` and register for remote notifications in `didFinishLaunchingWithOptions`:

```swift
import UserNotifications

// In didFinishLaunchingWithOptions:
UNUserNotificationCenter.current().delegate = self
application.registerForRemoteNotifications()
```

Add the `UNUserNotificationCenterDelegate` conformance and the required push token forwarding methods so Capacitor's push plugin receives tokens and notifications.

#### 3. Install Capacitor native plugins (package.json)
Add dependencies:
- `@capacitor/geolocation`
- `@capacitor/camera`
- `@capacitor/push-notifications`

#### 4. Update `capacitor.config.ts`
Add plugin configuration for PushNotifications (presentationOptions for foreground alerts):

```typescript
plugins: {
  PushNotifications: {
    presentationOptions: ["badge", "sound", "alert"],
  },
}
```

#### 5. Update `ios/App/App.xcodeproj/project.pbxproj`
Add the Push Notifications entitlement to the build settings. Specifically, add `CODE_SIGN_ENTITLEMENTS` pointing to an `App.entitlements` file, and create that entitlements file with the `aps-environment` key.

#### 6. Create `ios/App/App/App.entitlements`
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "...">
<plist version="1.0">
<dict>
    <key>aps-environment</key>
    <string>development</string>
</dict>
</plist>
```

### Manual Step After Push
Run `npx cap sync ios` after pulling these changes to ensure the native plugins are properly linked in the SPM package.


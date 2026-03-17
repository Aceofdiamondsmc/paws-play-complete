## Findings

`**Info.plist**` — All three required keys are present with descriptive text. This is fine and not the cause of the rejection.

`**App.entitlements**` — The `aps-environment` is set to `development`. For App Store / TestFlight distribution builds, Apple requires this to be `production`. This is the likely cause of the rejection.

`**capacitor.config.ts**` — Correctly configured with `PushNotifications` plugin options.

## Plan

### 1. Update `ios/App/App/App.entitlements`

Change `aps-environment` from `development` to  production.

```xml
<key>aps-environment</key>
<string>production</string>
```

This is the only change needed. The `Info.plist` keys and `capacitor.config.ts` are already correct.

### Note

After pulling this change, run `npx cap sync ios` and rebuild. The entitlement value controls which APNs gateway iOS uses — `development` works only for debug builds signed with a development certificate, while `production` is required for App Store and TestFlight distribution.
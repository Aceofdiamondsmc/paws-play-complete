

## Fix iPad Full Screen Requirement for App Store

### Problem
Apple rejected the IPA because the app supports iPad but is locked to portrait-only, which conflicts with iPad multitasking requirements. The fix is adding `UIRequiresFullScreen` to `Info.plist`.

### Plan

**`ios/App/App/Info.plist`** — Add the following key inside the main `<dict>` block:

```xml
<key>UIRequiresFullScreen</key>
<true/>
```

This tells Apple the app runs full-screen only and does not need to support Split View or Slide Over multitasking, which removes the landscape orientation requirement for iPad.

After applying, run `npx cap sync` and rebuild the IPA.

### Files Changed

| File | Change |
|------|--------|
| `ios/App/App/Info.plist` | Add `UIRequiresFullScreen` key |


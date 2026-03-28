

## Fix Build: Add Development Team for SPM Package Signing (Xcode 26)

### Progress
- Build #90: SPM conflict (capacitor-swift-pm 6.x vs 7.x) -- fixed by upgrading Capacitor to v7
- Build #91: SPM conflict (capacitor-swift-pm 7.x vs 8.x) -- fixed by downgrading RevenueCat to v11
- Build #92: SPM dependencies **resolved successfully**, but new error: Xcode 26 requires a development team for SPM package targets during archive

### Root Cause
Xcode 26 enforces code signing on all targets, including SPM package dependencies. The project-level build settings (Debug and Release) lack a `DEVELOPMENT_TEAM` entry, so RevenueCat's SPM target fails with "requires a development team."

### Changes

| File | Change |
|---|---|
| `ios/App/App.xcodeproj/project.pbxproj` | Add `DEVELOPMENT_TEAM = P8J757FA7F;` to **both** project-level build configurations (Debug on line ~237, Release on line ~293) |
| `ios/App/App/Info.plist` | Bump `CFBundleVersion` to `93` |

### After Implementation
Run locally:
```bash
cd ~/Development/paws-play-complete/paws-play-complete && git pull && npm run build && npx cap sync && git add . && git commit -m "Add dev team to project build settings for Xcode 26 SPM signing" && git push origin main
```
Then trigger Appflow Build #93.

### Why This Works
Setting `DEVELOPMENT_TEAM` at the project level allows Xcode to sign all targets -- including SPM package dependencies like RevenueCat -- during the archive step.


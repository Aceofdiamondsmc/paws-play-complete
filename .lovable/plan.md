

## Fix Build: Upgrade Capacitor to v7

### Root Cause
The previous downgrade to RevenueCat v11 didn't fix the conflict because **no version** of `@revenuecat/purchases-capacitor` supports SPM with `capacitor-swift-pm` 6.x. RevenueCat's SPM support was built targeting `capacitor-swift-pm` 7.x. The only fix is to upgrade all Capacitor packages to v7 so everything aligns on `capacitor-swift-pm` 7.x.

### Changes

| File | Change |
|---|---|
| `package.json` | Update all `@capacitor/*` packages from `^6.0.0` to `^7.0.0` |
| `package.json` | Revert RevenueCat back to `^12.3.0` (latest, since we're now on Cap 7) |
| `ios/App/CapApp-SPM/Package.swift` | Will be auto-updated by `npx cap sync` |
| `ios/App/App/Info.plist` | Bump `CFBundleVersion` to `91` |

### Packages to update in package.json
- `@capacitor/android`: `^6.0.0` → `^7.0.0`
- `@capacitor/app`: `^6.0.0` → `^7.0.0`
- `@capacitor/browser`: `^6.0.0` → `^7.0.0`
- `@capacitor/cli`: `^6.0.0` → `^7.0.0`
- `@capacitor/core`: `^6.0.0` → `^7.0.0`
- `@capacitor/filesystem`: `^6.0.0` → `^7.0.0`
- `@capacitor/ios`: `^6.0.0` → `^7.0.0`
- `@capacitor/local-notifications`: `^6.0.0` → `^7.0.0`
- `@capacitor/push-notifications`: `^6.0.0` → `^7.0.0`
- `@capacitor/share`: `^6.0.0` → `^7.0.0`
- `@revenuecat/purchases-capacitor`: `^11.1.1` → `^12.3.0`

### After Implementation
Run locally:
```bash
cd ~/Development/paws-play-complete/paws-play-complete
git pull
rm -rf node_modules package-lock.json
npm install
npm run build
npx cap sync
git add . && git commit -m "Upgrade Capacitor to v7 for RevenueCat SPM compat" && git push origin main
```
Then trigger a new Appflow build.

### Why this works
All Capacitor 7 plugins use `capacitor-swift-pm` 7.x. RevenueCat v11+ also uses `capacitor-swift-pm` 7.x. No more version conflict.


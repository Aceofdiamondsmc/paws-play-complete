

## Fix Build: Pin RevenueCat to v11 (Capacitor 7 Compatible)

### Root Cause
RevenueCat v12.x requires `capacitor-swift-pm` **8.x**, but Capacitor 7 plugins use `capacitor-swift-pm` **7.x**. RevenueCat v10.x and v11.x were built for Capacitor 7 and use `capacitor-swift-pm` 7.x -- so they are the correct match.

### Version Compatibility Matrix

```text
Capacitor 6 plugins  →  capacitor-swift-pm 6.x
Capacitor 7 plugins  →  capacitor-swift-pm 7.x  ← current project
RevenueCat 10.x/11.x →  capacitor-swift-pm 7.x  ← compatible
RevenueCat 12.x      →  capacitor-swift-pm 8.x  ← CONFLICT
```

### Change

| File | Change |
|---|---|
| `package.json` | Change `@revenuecat/purchases-capacitor` from `^12.3.0` to `~11.3.0` |
| `ios/App/App/Info.plist` | Bump `CFBundleVersion` to `92` |

### After Implementation
Run locally:
```bash
cd ~/Development/paws-play-complete/paws-play-complete && git pull && rm -rf node_modules package-lock.json && npm install && npm run build && npx cap sync && git add . && git commit -m "Pin RevenueCat to v11 for Cap 7 SPM compat" && git push origin main
```
Then trigger a new Appflow build.

### Why This Works
Capacitor 7 plugins and RevenueCat v11 both target `capacitor-swift-pm` 7.x. No version conflict.




## Fix Appflow Build: RevenueCat Version Conflict

### Problem
The build fails because `@revenuecat/purchases-capacitor@12.3.0` requires `capacitor-swift-pm` **8.x**, but all other Capacitor plugins (`@capacitor/share`, `@capacitor/app`, etc.) are on Capacitor **6.x**. These two version ranges are incompatible, so SPM cannot resolve dependencies.

### Solution
Downgrade `@revenuecat/purchases-capacitor` to the latest version that supports Capacitor 6. That is **v11.x** (specifically `^11.1.1`), which targets `capacitor-swift-pm` 6.x.

### Changes

| File | Change |
|---|---|
| `package.json` | Change `"@revenuecat/purchases-capacitor": "^12.3.0"` to `"@revenuecat/purchases-capacitor": "^11.1.1"` |

### After Implementation
Run locally:
```bash
cd ~/Development/paws-play-complete/paws-play-complete
git pull
rm -rf node_modules package-lock.json
npm install
npm run build
npx cap sync
git add . && git commit -m "Downgrade RevenueCat to v11 for Capacitor 6 compat" && git push origin main
```
Then trigger a new Appflow build.

### Alternative
If you want to stay on RevenueCat v12, you'd need to upgrade **all** Capacitor packages to v8 — a much larger migration. Downgrading RevenueCat is the simpler fix.


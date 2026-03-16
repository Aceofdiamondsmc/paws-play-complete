

## Fix iOS `.gitignore` for Appflow Builds

### Problem
The current `ios/.gitignore` ignores three items that Appflow needs to build:
1. **`App/Pods`** — CocoaPods dependencies (Appflow doesn't run `pod install`)
2. **`App/App/capacitor.config.json`** — Capacitor's generated config (required at build time)
3. **`App.xcworkspace`** — not currently ignored, but worth confirming it stays unignored

### Changes

**`ios/.gitignore`** — Remove `App/Pods` and `App/App/capacitor.config.json` from the ignore list. Keep ignoring `App/build`, `App/output`, `App/App/public`, `DerivedData`, `xcuserdata`, and `capacitor-cordova-ios-plugins`. The updated file:

```
App/build
App/output
App/App/public
DerivedData
xcuserdata

# Cordova plugins for Capacitor
capacitor-cordova-ios-plugins
```

This removes `App/Pods` (line 2) and `App/App/capacitor.config.json` (line 12) so they can be committed.

### Important Note — Manual Steps Required
After I make this change, you will need to do the following locally since Lovable cannot force-add previously ignored files:

1. **Git pull** the updated `.gitignore`
2. Run `npx cap sync ios` to generate `Pods/` and `capacitor.config.json`
3. Run `git add -f ios/App/Pods ios/App/App/capacitor.config.json` to force-track them
4. If an `App.xcworkspace` folder was generated, also `git add ios/App/App.xcworkspace`
5. `git commit` and `git push` — Appflow will then see all required files


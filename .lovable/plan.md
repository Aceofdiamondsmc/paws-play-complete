

## Plan: Switch iOS Back to SPM and Configure Appflow for SPM Builds

### Changes

**1. Delete `ios/App/Podfile`**
Remove the CocoaPods Podfile since we're switching back to SPM.

**2. Recreate `ios/App/CapApp-SPM/` directory**
Restore the SPM package structure that Capacitor 8 uses natively:

- `ios/App/CapApp-SPM/Package.swift` — Swift package manifest referencing Capacitor from `node_modules`
- `ios/App/CapApp-SPM/Sources/CapApp-SPM/CapApp-SPM.swift` — Minimal placeholder source file

**3. Update `ios/App/App.xcodeproj/project.pbxproj`**
Add SPM package references back to the Xcode project:
- Add `XCLocalSwiftPackageReference` pointing to `CapApp-SPM`
- Add `XCSwiftPackageProductDependency` for `Capacitor` and `CapacitorCordova`
- Add `packageReferences` and `packageProductDependencies` to the target
- Remove `COCOAPODS` from `OTHER_SWIFT_FLAGS` in Debug config

**4. Create `appflow.config.json` in project root**
```json
{
  "ios": {
    "enabled": true,
    "buildType": "debug",
    "environment": {
      "ENABLE_SPM_SUPPORT": "true"
    }
  }
}
```
This tells Appflow to use SPM instead of CocoaPods when building.

**5. Update `ios/.gitignore`**
Add back `App/Pods` to the ignore list (no longer needed), and ensure `CapApp-SPM` is not ignored.

### No Manual Steps Required
All files will be committed directly through Lovable. No local `pod install` or `npx cap sync` needed — SPM resolves dependencies at Xcode build time.


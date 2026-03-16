

## Plan: Migrate iOS from SPM to CocoaPods for Appflow

### Why the build fails
Your Capacitor 8 iOS project uses **Swift Package Manager (SPM)**, which does NOT generate `App.xcworkspace` or `Pods/`. Appflow expects a CocoaPods-based project with those folders. We need to migrate.

### What Lovable will do (file changes)

**1. Delete SPM-specific files**
- Remove `ios/App/CapApp-SPM/` directory (Package.swift, Sources/, README)
- Remove `ios/debug.xcconfig`

**2. Create `ios/App/Podfile`**
Standard Capacitor CocoaPods Podfile:
```ruby
require_relative '../../node_modules/@capacitor/ios/scripts/pods_helpers'

platform :ios, '15.0'
use_frameworks!

install! 'cocoapods', :disable_input_output_paths => true

def capacitor_pods
  pod 'Capacitor', :path => '../../node_modules/@capacitor/ios'
  pod 'CapacitorCordova', :path => '../../node_modules/@capacitor/ios'
end

target 'App' do
  capacitor_pods
end
```

**3. Update `ios/App/App.xcodeproj/project.pbxproj`**
- Remove all SPM references (`CapApp-SPM`, `XCLocalSwiftPackageReference`, `XCSwiftPackageProductDependency`, `packageReferences`, `packageProductDependencies`)
- Remove `debug.xcconfig` reference

**4. Confirm `ios/.gitignore`**
Already updated — does not ignore `Pods/` or `App.xcworkspace`. No change needed.

### What you must do locally after (manual steps)

Since Lovable cannot run native tooling, after these changes sync to GitHub:

1. `git pull`
2. `cd ios/App`
3. `pod install` — this generates `App.xcworkspace/` and `Pods/`
4. `git add -f ios/App/App.xcworkspace ios/App/Pods ios/App/Podfile.lock`
5. `git commit -m "Add CocoaPods workspace and Pods for Appflow"`
6. `git push`

After step 6, Appflow will find `ios/App/App.xcworkspace` and the build should succeed.


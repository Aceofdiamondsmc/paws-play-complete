
User wants the exact terminal commands + step order to ship a new iOS native build that includes the international support changes.

Context: They've already got `ios/` folder scaffolded (Capacitor 7 + SPM), `CFBundleVersion` is currently `114`, version `1.2`. They use Appflow per memory `ios-native-build-config`. They likely build locally in Xcode based on past flow.

Standard flow after frontend changes land:
1. Pull latest from GitHub (Lovable auto-commits)
2. `npm install` (in case deps changed — none did this round, but safe)
3. `npm run build` (build web assets into `dist/`)
4. `npx cap sync ios` (copy `dist/` into native iOS project + update plugins)
5. Bump `CFBundleVersion` 114 → 115 in `ios/App/App/Info.plist` (App Store requires unique build number per upload)
6. `npx cap open ios` (opens Xcode)
7. In Xcode: select "Any iOS Device", Product → Archive → Distribute App → App Store Connect
8. In App Store Connect: assign build to TestFlight / new version, submit for review

No code changes needed. Pure command/step list. Concise.

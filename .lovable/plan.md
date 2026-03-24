

## Apple Review Fixes - Completed

### Issue 1: Guideline 1.2 - UGC Safety ✅
- Added `tos_accepted_at` column to `profiles` table
- Created `content_reports` table with RLS
- Built `TOSAcceptanceDialog` — shown on first visit to Social after login
- Built `ReportPostDialog` — accessible via post dropdown menu
- Added Report + Block options on all non-author posts in Social feed

### Issue 5: Guideline 5.1.1(v) - Guest Browsing ✅
- Added "Explore Without an Account" button on Landing page → navigates to /parks

### Issues 2, 3, 4, 6 — User Action Required
- **Issue 2**: Replace app icon in `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
- **Issue 3**: Answer business model questions in App Store Connect
- **Issue 4**: Create demo account and provide credentials in App Review Information
- **Issue 6**: Account deletion already exists — reviewer needs demo credentials to find it

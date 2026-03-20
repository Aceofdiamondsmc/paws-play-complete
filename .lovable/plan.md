## Completed: Three Fixes

### 1. Flyer avatar — canvas-based image conversion ✅
Replaced `toDataUrl` (fetch-based) with `imageToBase64` (canvas-based) in `LostDogAlertModal.tsx`. Images are loaded via `<img crossOrigin="anonymous">`, downscaled to max 800px, and exported as JPEG base64. 15s timeout. Returns `null` on failure instead of throwing. `FlyerTemplate.tsx` now shows a placeholder (🐕 + dog name) when no avatar is available.

### 2. Free Trial button — green ✅
Changed only the "Start Your Free Trial" button to `bg-success hover:bg-success/90 text-white`. All other elements unchanged.

### 3. Pull-to-refresh ✅
Created `usePullToRefresh` hook. Applied to Social (posts refresh), Explore (services refetch), and Parks (searchNearMe). Pack skipped due to swipe gesture conflict.

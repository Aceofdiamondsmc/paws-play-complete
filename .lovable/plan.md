

## Fix Zoom/Scale Issues and Lock Portrait Mode

### Problem
1. The app sometimes zooms or scales out of proportion on mobile, leaving users stuck at an awkward zoom level
2. Landscape (horizontal) rotation causes layout issues

### Plan

#### 1. Prevent pinch-zoom and add reset-zoom button

**`index.html`** - Update the viewport meta tag to disable user scaling:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
```

**New component: `src/components/layout/ResetZoomButton.tsx`**
- Detects when `window.visualViewport.scale !== 1` (the page is zoomed)
- Shows a floating button with the Lucide `Minimize2` icon (two arrow heads facing each other) in the bottom-right area above the nav bar
- On click, resets zoom by programmatically updating the viewport meta tag and scrolling to top
- Only renders on mobile (uses existing `useIsMobile` hook)
- Animated fade-in when it appears

**`src/components/layout/AppLayout.tsx`** - Add the `ResetZoomButton` component inside the layout

#### 2. Lock to portrait mode

**`ios/App/App/Info.plist`** - Remove landscape orientations, keeping only:
```xml
<string>UIInterfaceOrientationPortrait</string>
```
Remove `UIInterfaceOrientationLandscapeLeft` and `UIInterfaceOrientationLandscapeRight` from both iPhone and iPad arrays.

**`android/app/src/main/AndroidManifest.xml`** - Add `android:screenOrientation="portrait"` to the main activity element.

### Files Changed

| File | Change |
|------|--------|
| `index.html` | Disable user scaling in viewport meta |
| `src/components/layout/ResetZoomButton.tsx` | New component - floating reset-zoom button using `Minimize2` icon |
| `src/components/layout/AppLayout.tsx` | Include `ResetZoomButton` |
| `ios/App/App/Info.plist` | Remove landscape orientations |
| `android/app/src/main/AndroidManifest.xml` | Lock to portrait orientation |


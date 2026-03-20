

## Plan: Three Fixes (Final Revised)

### 1. Flyer avatar — canvas-based image conversion

**Root cause**: The current `toDataUrl` uses `fetch()` to download images. For large cross-origin images from Supabase storage, `fetch()` fails silently due to CORS restrictions in the iframe print context (especially iOS Safari). The catch falls back to the raw URL, which also fails in the sandboxed print renderer. The one image that worked was likely small enough (48KB) to have been cached by the browser.

**Fix**: Replace `toDataUrl` with a canvas-based `imageToBase64` function that:
- Creates an `<img>` element with `crossOrigin="anonymous"`
- Draws it onto a hidden canvas, downscaling to max 800px (keeps base64 manageable for multi-MB photos)
- Exports as JPEG at 80% quality
- Has a 15-second timeout for slow connections
- If conversion fails completely, passes `null` so the flyer shows a text placeholder

**Files changed**:

| File | Change |
|------|--------|
| `src/components/lost-dog/LostDogAlertModal.tsx` | Replace `toDataUrl` with canvas-based `imageToBase64`; use for both avatar and QR |
| `src/components/lost-dog/FlyerTemplate.tsx` | Add text placeholder fallback in `generateFlyerHTML` when `avatarUrl` is null (shows dog name in bordered box instead of blank space) |

### 2. Free Trial button — green color

**Only the "Start Your Free Trial" button** (line 134-153, the logged-in no-subscription CTA) changes to green. The logged-out "Sign Up to Start Free Trial" button and everything else stays exactly as-is.

**File: `src/components/explore/FreeTrialBanner.tsx`**
- Line 137 only: change className to include `bg-success hover:bg-success/90 text-white`

### 3. Pull-to-refresh

Create a reusable hook and apply to key pages.

**New file: `src/hooks/usePullToRefresh.tsx`**
- Custom hook detecting touch-pull gestures when `scrollTop === 0`
- Shows a visual spinner/indicator during pull and refresh
- Returns: a ref to attach to the scrollable container, an indicator component to render at top, and an `isRefreshing` state

**Pages updated**:

| Page | Refresh callback | Source |
|------|-----------------|--------|
| `src/pages/Social.tsx` | `refresh` (already exported from `usePosts`) | `usePosts().refresh` which calls `fetchPosts` |
| `src/pages/Explore.tsx` | `refetch` from react-query | `useServices` / `useNearbyServices` use `useQuery`, so `.refetch()` is available |
| `src/pages/Parks.tsx` | trigger re-mount of parks hook | Will add a `refreshKey` state to force re-fetch |
| `src/pages/Pack.tsx` | re-fetch nearby dogs | Will add a `refreshKey` state to force re-fetch |

Each page wraps its main scrollable area with the pull-to-refresh hook and renders the indicator component at the top of the content area.

### Technical details

**Canvas-based image conversion** (replacing `toDataUrl`):
```text
1. Create new Image() with crossOrigin="anonymous"
2. Set src to the Supabase URL
3. On load → create canvas, scale to max 800px
4. ctx.drawImage() → canvas.toDataURL('image/jpeg', 0.8)
5. Wrapped in Promise with 15s timeout
6. On error → resolve(null) instead of throwing
```

**Pull-to-refresh gesture detection**:
```text
touchstart → record Y position (only if scrollTop === 0)
touchmove  → calculate delta, show indicator if pulling > 60px
touchend   → if pulled far enough, call onRefresh()
             show spinner until onRefresh() resolves
             then hide indicator with animation
```


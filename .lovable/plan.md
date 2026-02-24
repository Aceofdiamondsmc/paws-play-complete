

## Professional Video Previews Across the App

### Problem
When you select or record a video in the create post form (and admin edit modal), you see a bare `<video>` element that shows a black rectangle requiring you to press play. This feels unpolished.

### Solution
Make video previews auto-play silently as looping clips -- the same way Instagram, TikTok, and other professional apps handle inline video previews. No play button needed; the video just plays immediately as a muted, looping preview so you can see what you recorded.

### Changes

**`src/components/social/CreatePostForm.tsx` (line 219)**
- Change `<video src={previewUrl} controls playsInline preload="metadata" .../>` to add `autoPlay muted loop` and remove `controls`
- This makes the preview silently loop so you instantly see your video content without tapping anything

**`src/components/social/AdminEditPostModal.tsx` (lines 241-245)**
- Same treatment: add `autoPlay muted loop playsInline` and remove `controls` on the admin video preview
- Gives admins an instant silent preview of the video content

### Technical Details

Both changes are one-line attribute swaps:

```tsx
// Before (both files)
<video src={url} controls className="..." />

// After
<video src={url} autoPlay muted loop playsInline className="..." />
```

- **`autoPlay`**: starts playback immediately -- no tap needed
- **`muted`**: required for autoplay to work on all browsers (Chrome, Safari policy)
- **`loop`**: keeps the preview playing continuously
- **`playsInline`**: prevents fullscreen takeover on iOS
- No `controls` shown since this is just a preview; the full player with controls is shown in the feed via VideoPlayer

### Files Changed

| File | Change |
|------|--------|
| `src/components/social/CreatePostForm.tsx` | Video preview: add `autoPlay muted loop`, remove `controls` |
| `src/components/social/AdminEditPostModal.tsx` | Video preview: add `autoPlay muted loop playsInline`, remove `controls` |


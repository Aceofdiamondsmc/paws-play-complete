

## Add Video Thumbnail/Cover to Social Feed

### Problem
Videos in the Social feed show as a blank video player until the user hits play, which looks unappealing and gives no visual preview of the content.

### Solution
Replace the bare `<video>` element with a poster-based approach that generates a thumbnail from the video's first frame, displayed as a cover image with a play button overlay. When tapped, it switches to the full video player.

### How It Works
1. **Auto-generate a poster frame**: Use the browser's native `<video>` element off-screen to capture the first frame of the video onto a `<canvas>`, producing a data URL used as the cover image.
2. **Play button overlay**: Show the cover image with a centered play icon. Tapping it reveals the actual video player and auto-plays.
3. **Fallback**: If frame extraction fails (e.g., CORS), show a branded gradient placeholder with a play icon.

### Technical Details

**New component: `src/components/social/VideoPlayer.tsx`**

A self-contained component that:
- Accepts a `src` (video URL) prop
- On mount, loads the video in a hidden `<video>` element, seeks to 0.5s, draws the frame to a canvas, and stores the resulting data URL as `poster`
- Renders in two states:
  - **Cover mode** (default): Shows the poster image (or gradient fallback) with a semi-transparent play button overlay
  - **Playing mode**: Shows the standard `<video controls>` element with `autoPlay`

```tsx
// Pseudocode
function VideoPlayer({ src }) {
  const [poster, setPoster] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Create off-screen video, seek to 0.5s, draw to canvas
    // setPoster(canvas.toDataURL())
  }, [src]);

  if (playing) {
    return <video src={src} controls autoPlay playsInline />;
  }

  return (
    <div onClick={() => setPlaying(true)}>
      {poster ? <img src={poster} /> : <GradientFallback />}
      <PlayCircleOverlay />
    </div>
  );
}
```

**Update: `src/pages/Social.tsx`**
- Replace the inline `<video>` block (lines 409-418) with `<VideoPlayer src={post.video_url} />`

**Update: `src/components/social/CreatePostForm.tsx`**
- The existing video preview in the create form already shows a `<video>` thumbnail -- no changes needed there.

### Files Changed

| File | Change |
|------|--------|
| `src/components/social/VideoPlayer.tsx` | New component: auto-generates video cover frame with play overlay |
| `src/pages/Social.tsx` | Replace inline `<video>` with `<VideoPlayer>` component |


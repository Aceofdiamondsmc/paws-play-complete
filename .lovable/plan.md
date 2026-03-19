

## Fix Post Sharing: Share as Image Instead of HTML Link

### Problem
When sharing a post, the share URL points to the `og-post` edge function which serves an HTML page. Recipients see raw HTML instead of a rich preview or image.

### Solution
Use the **Web Share API's file sharing** capability to share posts as JPG images:

1. **Posts with images**: Fetch the post's `image_url`, convert to a `File` blob, and share it as a JPG file alongside the text caption and link.

2. **Posts without images (text-only)**: Use `html-to-image` (already installed) to render a branded card as a JPG and share that as a file.

3. **Fallback**: If file sharing isn't supported (desktop browsers), fall back to copying the OG link to clipboard (current behavior).

### File: `src/pages/Social.tsx` — `handleShare` function

Update the function to accept `imageUrl` as a parameter and:

- If `imageUrl` exists: fetch it, create a `File` object, share with `navigator.share({ files: [file], title, text })`
- If no image: render a small hidden card element (app logo, author name, post text, branded footer) using `html-to-image`'s `toJpeg()`, create a `File` from the blob, share it
- Keep the OG link as the `url` in share data so the link is still included
- Add the `imageUrl` argument at the call site (line ~631), passing `post.image_url`

### Share call site update

```tsx
onClick={() => handleShare(
  post.id,
  post.content || '',
  post.author?.display_name || post.author?.username || 'Someone',
  post.image_url || null
)}
```

### Hidden card template (for text-only posts)

A small off-screen `div` (ref-based) styled as a branded share card:
- 600×600px, primary gradient background
- App logo at top, author name, post text (truncated), "pawsplayrepeat.com" footer
- Rendered to JPEG via `toJpeg()` only when sharing

### Files Modified
- `src/pages/Social.tsx` — updated `handleShare` + share card element + call site


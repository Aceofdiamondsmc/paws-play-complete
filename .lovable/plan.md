

## Enable Share Feature for Social Posts

This plan adds sharing functionality to the Social tab, allowing users to share posts using the native Web Share API with a clipboard fallback.

---

### Current State

The Share button already exists in the UI (line 351-353) with the `Share2` icon imported, but it has no `onClick` handler or functionality.

---

### Summary of Changes

| Change | Description |
|--------|-------------|
| 1 | Add `handleShare` function with Web Share API support |
| 2 | Implement clipboard fallback for unsupported browsers |
| 3 | Wire the existing Share button to call `handleShare` with post data |
| 4 | Show toast notifications for success/error feedback |

---

### Implementation Details

#### 1. Add handleShare Function (After line 96)

Create a share handler that detects API support and falls back gracefully:

```typescript
const handleShare = async (postId: string, postContent: string, authorName: string) => {
  // Construct the share URL - link to the social page (or specific post if routing exists)
  const shareUrl = `${window.location.origin}/social`;
  
  // Truncate content for share text if too long
  const truncatedContent = postContent.length > 100 
    ? postContent.substring(0, 100) + '...' 
    : postContent;
  
  const shareData = {
    title: `${authorName} on Paws Play Repeat`,
    text: truncatedContent,
    url: shareUrl,
  };

  // Check if Web Share API is available
  if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
    try {
      await navigator.share(shareData);
      // Share was successful (or user cancelled - no error thrown for cancel)
    } catch (error) {
      // User cancelled or error occurred
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast.error('Failed to share post');
      }
    }
  } else {
    // Fallback: Copy link to clipboard
    try {
      const shareText = `${truncatedContent}\n\nCheck it out on Paws Play Repeat: ${shareUrl}`;
      await navigator.clipboard.writeText(shareText);
      toast.success('Link copied!', {
        description: 'Post link copied to your clipboard',
      });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  }
};
```

#### 2. Update Share Button (Lines 351-353)

Wire the button to call `handleShare` with the post's data:

**Current code:**
```tsx
<button className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto">
  <Share2 className="w-5 h-5" />
</button>
```

**Updated code:**
```tsx
<button 
  onClick={() => handleShare(
    post.id, 
    post.content || '', 
    post.author?.display_name || post.author?.username || 'Someone'
  )}
  className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors ml-auto"
  aria-label="Share post"
>
  <Share2 className="w-5 h-5" />
</button>
```

---

### Share Flow

```text
User taps Share button
        |
        v
+-------------------+
| navigator.share   |
| supported?        |
+-------------------+
    |           |
   Yes          No
    |           |
    v           v
+----------+  +------------------+
| Open     |  | Copy to          |
| native   |  | clipboard        |
| share    |  +------------------+
| sheet    |          |
+----------+          v
                +------------------+
                | Show "Link       |
                | copied!" toast   |
                +------------------+
```

---

### Shared Content Format

**Native Share (iOS/Android):**
- Title: "[Author Name] on Paws Play Repeat"
- Text: Post content (truncated to 100 chars)
- URL: `https://pawsplayrepeat.lovable.app/social`

**Clipboard Fallback:**
```
[Post content truncated]...

Check it out on Paws Play Repeat: https://pawsplayrepeat.lovable.app/social
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Social.tsx` | Add `handleShare` function and wire to Share button |

---

### Technical Notes

- `navigator.share` is widely supported on mobile (iOS Safari, Chrome Android) but limited on desktop
- `navigator.canShare()` check prevents errors on browsers that have share but don't support specific content types
- `AbortError` is thrown when user cancels - this is expected and should not show an error
- The `toast` import from `sonner` is already present in the file (line 28)
- Using `window.location.origin` ensures the correct URL in both preview and production environments


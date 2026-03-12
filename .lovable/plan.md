

## Two Changes: Comment Photo Uploads + SOS FAB Position

### 1. Comment Photo Uploads

The `post_comments` table currently has no `image_url` column — it only stores text (`body`). To support photo comments, we need:

**Database migration**: Add an `image_url` nullable text column to `post_comments`.

```sql
ALTER TABLE public.post_comments ADD COLUMN image_url text;
```

**`src/hooks/usePosts.tsx`**:
- Update the `Comment` interface to include `image_url: string | null`
- Update `addComment` to accept an optional `imageUrl` parameter and insert it
- Update `updateComment` to accept an optional `imageUrl` parameter

**`src/components/social/CommentsDrawer.tsx`**:
- Add a small image-upload button (camera/image icon) next to the text input in the sticky bottom bar
- Use the existing `useImageUpload` hook to handle file selection and upload to `post-images` bucket
- Show a small thumbnail preview of the selected/uploaded image below the input bar (with an X to remove)
- When submitting, pass the uploaded image URL to `addComment`
- In the comment list, render `comment.image_url` as a small rounded image below the comment text (tappable to view full size)
- During editing, show existing image and allow removal or replacement

**UX details**:
- The upload button sits to the left of the text input (small icon-only button)
- Image preview is a compact thumbnail (48x48) with a remove X badge
- Comments with images show the image below the text in the bubble, sized to fit within the bubble width
- HEIC conversion is already handled by `useImageUpload` → `ensureJpeg`

### 2. SOS FAB Position

The `LostDogFAB` currently uses `bottom-28` (7rem / 112px). The comments drawer avatars start near the bottom of the viewport. Raising the SOS button slightly prevents overlap.

**`src/components/lost-dog/LostDogFAB.tsx`**:
- Change `bottom-28` to `bottom-36` (9rem / 144px) to clear the comment avatars and bottom nav area

### Files Changed

| File | Change |
|------|--------|
| **DB migration** | Add `image_url text` column to `post_comments` |
| `src/hooks/usePosts.tsx` | Update `Comment` type, `addComment`, `updateComment` to support `image_url` |
| `src/components/social/CommentsDrawer.tsx` | Add image upload button, preview, display in comment bubbles |
| `src/components/lost-dog/LostDogFAB.tsx` | Raise FAB from `bottom-28` to `bottom-36` |


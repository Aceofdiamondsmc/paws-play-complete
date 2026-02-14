

## Instagram-Style Social Feed Polish

### Changes

**`src/pages/Social.tsx`** -- 3 targeted updates:

1. **Square Post Images**: Replace the current `max-h-80` image styling with a 1:1 aspect ratio container using the existing `AspectRatio` component from `@radix-ui/react-aspect-ratio`. Both `post.imageUrl` and `post.image_url` renders (lines 335-353) will be wrapped in `<AspectRatio ratio={1}>` with `object-cover w-full h-full rounded-xl`.

2. **Like Button**: The heart already turns red (`text-destructive`) and fills (`fill-current`) when liked -- this is working correctly. No changes needed here.

3. **Empty State**: Update the empty state message (lines 406-414) from "No posts yet / Be the first to share with the pack!" to a friendlier:
   - Icon: PawPrint instead of MessageCircle
   - Title: "The Pack is gathering..."
   - Subtitle: "Be the first to post! Share your pup's latest adventure."

### Technical Details

| Area | Current | Updated |
|------|---------|---------|
| Post images | `max-h-80 object-cover` | `AspectRatio ratio={1}` with `object-cover w-full h-full` |
| Empty state icon | `MessageCircle` | `PawPrint` |
| Empty state text | "No posts yet" | "The Pack is gathering..." |
| Like button | Already red + filled when liked | No change needed |

Only one file modified: `src/pages/Social.tsx`.

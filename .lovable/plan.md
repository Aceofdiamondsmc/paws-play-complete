

## Admin Posting on the Social Tab

### Approach

Rather than editing user profile pictures (which is complex and invasive), the better professional approach is to let administrators **post as "Admin" / "PawsPlay Team"** directly from the Social tab. The database already has an `author_display_name` field on the `posts` table -- we just need to surface it in the create post flow for admins.

### How It Will Work

- When an admin is logged in, the Create Post form shows an **extra field** at the top: a text input for "Post as" with a placeholder like "PawsPlay Team"
- If the admin fills it in, the post appears in the feed under that custom name instead of their personal profile name
- If left blank, the post appears as their normal user account (default behavior)
- A small shield badge appears next to admin-branded posts so users know it's official

### Changes

**1. `src/hooks/usePosts.tsx`**
- Update `createPost` to accept an optional `authorDisplayName` parameter
- Include `author_display_name` in the insert payload when provided

**2. `src/components/social/CreatePostForm.tsx`**
- Add an `isAdmin` prop
- When `isAdmin` is true, render a "Post as" input field above the content area (with a ShieldCheck icon)
- Pass the custom name up through `onPost` callback

**3. `src/pages/Social.tsx`**
- Pass `isAdmin` to `CreatePostForm`
- Update `handlePost` to forward the author display name to `createPost`

### Technical Details

**CreatePostForm.tsx** -- new prop and field:
```tsx
interface CreatePostFormProps {
  onPost: (content: string, imageUrl?: string, isReview?: boolean, 
           parkId?: string, rating?: number, videoUrl?: string,
           authorDisplayName?: string) => Promise<void>;
  isPosting: boolean;
  isAdmin?: boolean;
}
```

When `isAdmin` is true, render above the textarea:
```tsx
<div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
  <ShieldCheck className="w-5 h-5 text-primary" />
  <Input
    placeholder="Post as (e.g. PawsPlay Team)..."
    value={adminDisplayName}
    onChange={...}
    className="flex-1"
  />
</div>
```

**usePosts.tsx** -- updated createPost signature:
```tsx
const createPost = async (
  content: string, 
  imageUrl?: string, 
  visibility = 'public', 
  videoUrl?: string,
  authorDisplayName?: string
) => {
  await supabase.from('posts').insert({
    author_id: user.id,
    content,
    image_url: imageUrl,
    video_url: videoUrl,
    visibility,
    author_display_name: authorDisplayName || null,
  });
};
```

**Social.tsx** -- wire it up:
```tsx
<CreatePostForm 
  onPost={handlePost} 
  isPosting={isPosting} 
  isAdmin={isAdmin} 
/>
```

### Files Changed

| File | Change |
|------|--------|
| `src/hooks/usePosts.tsx` | Add `authorDisplayName` param to `createPost`, include in insert |
| `src/components/social/CreatePostForm.tsx` | Add `isAdmin` prop, "Post as" input for admins, pass name through `onPost` |
| `src/pages/Social.tsx` | Pass `isAdmin` to CreatePostForm, forward display name in `handlePost` |




## Admin Override for Post Profile Picture

### What This Does
Adds the ability for admins to change the profile/avatar picture shown on any post -- just like you can already override the author name. Upload a custom avatar or paste a URL, and that post will display the new picture instead of the user's real profile photo.

### Database Changes

**Add `author_avatar_url` column to `posts` table**
- New nullable text column that, when set, overrides the profile avatar for that specific post
- Update the `public_posts` view to use `COALESCE(p.author_avatar_url, pr.avatar_url)` -- if a per-post avatar is set, use it; otherwise fall back to the user's profile pic

### Code Changes

**`src/components/social/AdminEditPostModal.tsx`**
- Add a new "Author Avatar" field in the form (above "Author Display Name") with:
  - Upload button to upload an image to the `post-images` bucket
  - URL text input for pasting a link
  - Circular avatar preview showing current/new image
  - Clear (X) button to remove the override
- Include `author_avatar_url` in the save payload

**`src/pages/Social.tsx`**
- Pass the current `author_avatar_url` to the admin edit modal as a new prop
- When rendering each post's avatar, prefer `post.author_avatar_url` (which now comes from the COALESCE in the view, automatically handling overrides)

**`src/hooks/usePosts.tsx`**
- No changes needed -- the view already returns `author_avatar_url` and the code maps it to `author.avatar_url`

### Technical Details

Migration SQL:
```sql
ALTER TABLE posts ADD COLUMN author_avatar_url text;

DROP VIEW IF EXISTS public_posts;
CREATE VIEW public_posts WITH (security_invoker = on) AS
SELECT p.id, p.author_id, p.content, p.image_url, p.video_url,
       p.visibility, p.created_at, p.updated_at, p.dog_id, p.pup_name,
       p.likes_count, p.comments_count,
       COALESCE(p.author_display_name, pr.display_name) AS author_display_name,
       COALESCE(p.author_avatar_url, pr.avatar_url) AS author_avatar_url
FROM posts p
LEFT JOIN profiles pr ON pr.id = p.author_id
WHERE p.visibility = 'public'::post_visibility;
```

AdminEditPostModal avatar section (inside the scrollable area, above Author Display Name):
```tsx
<div className="space-y-2">
  <Label>Author Avatar</Label>
  <div className="flex items-center gap-3">
    <Avatar className="w-14 h-14 border-2 border-primary/30">
      <AvatarImage src={authorAvatarUrl || undefined} />
      <AvatarFallback>...</AvatarFallback>
    </Avatar>
    <Button variant="outline" size="sm" onClick={upload}>Upload</Button>
    {authorAvatarUrl && <Button variant="ghost" size="icon" onClick={clear}><X /></Button>}
  </div>
  <Input placeholder="Or paste avatar URL..." value={authorAvatarUrl} onChange={...} />
</div>
```

### Files Changed

| File | Change |
|------|--------|
| Migration SQL | Add `author_avatar_url` column to `posts`, recreate `public_posts` view with COALESCE |
| `src/components/social/AdminEditPostModal.tsx` | Add avatar upload/URL field, include in save payload |
| `src/pages/Social.tsx` | Pass `author_avatar_url` to admin edit modal props |

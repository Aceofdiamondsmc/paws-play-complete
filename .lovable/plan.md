

## Fix: Snapshot Avatar and Dog Name at Post Creation Time

### Problem
When a user updates their profile avatar, **all** posts sharing that `author_id` change their displayed avatar — because the `public_posts` view falls back to the live profile `avatar_url` when no per-post `author_avatar_url` is set. Similarly, the `pup_name` field can get cleared during edits, causing "Meet a Friend" instead of "Meet Banky".

### Root Cause
`createPost` in `usePosts.tsx` does not snapshot the user's current avatar or selected dog name into the post record. The `public_posts` view then pulls live profile data as a fallback.

### Solution

**1. `src/hooks/usePosts.tsx` — Auto-snapshot avatar + dog name on post creation**
- In `createPost`, if no explicit `authorAvatarUrl` is provided, automatically fetch the user's current `avatar_url` from their profile and store it in `author_avatar_url` on the post row.
- Accept a `dogId` parameter and look up the dog's name to populate `pup_name` on the post. This ensures the dog name persists even if the dog record changes later.

**2. `src/components/social/CreatePostForm.tsx` — Pass selected dog info**
- When a user selects a dog for their post, pass the `dogId` through to `createPost` so the dog name gets snapshotted into `pup_name`.

**3. `src/components/social/EditPostModal.tsx` — Preserve `pup_name` during edits**
- The current edit modal only updates `content` — this is already safe. No change needed here.

**4. `src/components/social/AdminEditPostModal.tsx` — No change needed**
- Already handles `pup_name` and `author_avatar_url` explicitly.

### Technical Details

In `usePosts.tsx` `createPost`:
```ts
// If no custom avatar provided, snapshot the user's current profile avatar
if (!authorAvatarUrl) {
  const { data: prof } = await supabase
    .from('profiles')
    .select('avatar_url, display_name')
    .eq('id', user.id)
    .single();
  authorAvatarUrl = prof?.avatar_url || undefined;
  if (!authorDisplayName) authorDisplayName = prof?.display_name || undefined;
}
```

This ensures every new post has its own `author_avatar_url` frozen at creation time, so future profile changes never cascade to old posts.

### For existing affected posts
The already-affected mock posts need their `author_avatar_url` set back to the correct images via the Admin Edit tool (one-time manual fix per post), or a one-time SQL update targeting posts where `author_avatar_url IS NULL AND author_id = '<harry_id>'`.


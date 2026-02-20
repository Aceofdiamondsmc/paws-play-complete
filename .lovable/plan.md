
## Migrate Social Feed to Use PostgreSQL Views

### Goal
Replace the multi-step manual join logic in `usePosts.tsx` with a clean `public_posts` view that pre-joins author profile data. The `public_profiles` view is already used correctly everywhere for user lookups and will remain unchanged.

### What Exists Today

| Resource | Status |
|---|---|
| `public_profiles` view | Exists — already used correctly |
| `public_posts` view | Does NOT exist — needs to be created |
| Write operations (posts, profiles) | Correct — all target base tables |
| `usePosts.tsx` fetchPosts | Runs 4 separate queries: posts → profiles → dogs → likes |

### Step 1 — Create the `public_posts` Database View (Migration)

A new migration will create the view by joining `posts` with `profiles`:

```sql
CREATE OR REPLACE VIEW public.public_posts
WITH (security_invoker = on)
AS
  SELECT
    p.id,
    p.author_id,
    p.content,
    p.image_url,
    p.visibility,
    p.created_at,
    p.updated_at,
    p.dog_id,
    p.pup_name,
    p.likes_count,
    p.comments_count,
    -- Pre-joined author fields, prioritising the per-post override
    COALESCE(p.author_display_name, pr.display_name) AS author_display_name,
    pr.avatar_url AS author_avatar_url
  FROM public.posts p
  LEFT JOIN public.profiles pr ON pr.id = p.author_id
  WHERE p.visibility = 'public';
```

Key design decisions:
- `security_invoker = on` — the view respects RLS of the calling user (consistent with `public_profiles`)
- Only `public` posts are exposed — private posts are excluded from the view entirely
- `author_display_name` uses `COALESCE` to honour the admin-set per-post override before falling back to the profile name
- `author_avatar_url` is a new clean column, replacing the multi-step join

### Step 2 — Update `usePosts.tsx` — `fetchPosts`

Replace the current 4-query chain with a single query against `public_posts`, plus one query for liked post IDs.

**Remove:**
- Query to `public_profiles` for author lookups (now embedded in view)
- Query to `dogs` for dog name lookup (kept as fallback but simplified)

**Add:**
- Single query to `public_posts` ordered by `created_at DESC`, limit 50
- Map `row.author_display_name` and `row.author_avatar_url` directly from the view row
- Keep the `post_likes` query for the current user's liked posts (unchanged)
- Keep the `dogs` query for `dogName` only (for the "Meet [Name]" button) — but scope it to the post's `dog_id` only, skipping the owner-based fallback since `author_display_name` is now in the view
- Write operations (`createPost`, `likePost`, `deletePost`) remain targeting base `posts` and `post_likes` tables — no changes

**New enrichment shape per post:**
```typescript
{
  ...row,                            // all view columns
  author: {
    display_name: row.author_display_name,
    avatar_url: row.author_avatar_url,
  },
  likesCount: row.likes_count,
  commentsCount: row.comments_count,
  isLiked: likedPostIds.has(row.id),
  dogName: /* from dog_id lookup or pup_name */,
  image_url: getPupImage(dogName, row.image_url),
}
```

### Step 3 — Update `usePosts.tsx` — Real-time `fetchNewPost`

The real-time INSERT handler currently fetches from `public_profiles`. Update it to query `public_posts` for the newly inserted post ID instead, so it gets the full pre-joined data in one call:

```typescript
// Instead of fetching from public_profiles separately:
const { data: postRow } = await supabase
  .from('public_posts')
  .select('*')
  .eq('id', post.id)
  .single();
```

### Step 4 — Update `Social.tsx` — Column Name Alignment

The UI currently reads `post.author?.avatar_url` and `post.author?.display_name`. After the change, these come from the flattened `author` object built in the hook — no template changes needed. The existing access patterns in `Social.tsx` will continue to work because the hook constructs the same `author` shape.

One small fix: `Social.tsx` line 391 checks `post.imageUrl || post.image_url`. Since we always use `image_url` (snake_case from the DB), remove the `post.imageUrl` fallback for cleanliness.

### Step 5 — `usePostComments` — No Changes Needed

The comments hook already correctly uses `public_profiles` for commenter lookups. This stays unchanged.

### Files to Change

| File | Change Type | Change |
|---|---|---|
| New migration SQL | Create | `public_posts` view with security_invoker |
| `src/hooks/usePosts.tsx` | Update | Replace multi-query fetch with single `public_posts` view query; update `fetchNewPost` |
| `src/pages/Social.tsx` | Minor cleanup | Remove redundant `post.imageUrl` fallback |

### What Does NOT Change

- All write operations (`createPost`, `likePost`, `deletePost`, `updateProfile`) continue to target the base `posts`, `post_likes`, and `profiles` tables
- `usePostComments` — no changes
- `public_profiles` usage in `useFriendships`, `useMessages`, `usePlaydates`, `Pack.tsx` — no changes
- `useAuth` reading from `profiles` for the current user's own record — no changes
- Real-time channel subscriptions listen to the base `posts` table — this stays correct (views cannot be subscribed to via Postgres CDC)

### Security Note

With `security_invoker = on`, the view evaluates RLS as the querying user. Since the view already filters to `visibility = 'public'`, unauthenticated and authenticated users will both only see public posts — the same behaviour as today, but expressed at the database level rather than in application code.

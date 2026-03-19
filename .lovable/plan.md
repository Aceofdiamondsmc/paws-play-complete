

## Fix "Pack Friends" Filter to Query Only Friend Posts

### Problem
The current "Pack Friends" filter fetches the latest 50 posts globally, then filters client-side by `friendIds`. This means:
1. If a friend's post isn't in the top 50 most recent, it won't appear
2. Users may see an empty "Pack Friends" tab even though their friends have posted

### Solution
When the "Pack Friends" tab is active, fetch posts filtered server-side by friend IDs instead of relying on client-side filtering of a global feed.

### Changes

**`src/hooks/usePosts.tsx`**
- Add an optional `authorIds` parameter to `fetchPosts` that, when provided, adds a `.in('author_id', authorIds)` filter to the `public_posts` query
- Export a new function or accept a filter parameter so the Social page can request friend-only posts

**`src/pages/Social.tsx`**
- When `activeFilter` changes to `'friends'`, pass the accepted friend IDs to `usePosts` so it fetches only friend-authored posts from the server
- Remove the client-side `friendIds.has(p.author_id)` filter since filtering now happens server-side
- Re-fetch posts when switching between tabs (all vs friends vs reviews)

### Technical Approach
The simplest approach: add an `authorFilter` state to `usePosts` that triggers a re-fetch with `.in('author_id', [...ids])` when set. The Social page will call a `setAuthorFilter(friendIds)` when the "Pack Friends" tab is selected, and `setAuthorFilter(null)` for "All Posts".

This ensures the full 50-post limit is used for friend posts specifically, not wasted on unrelated posts.


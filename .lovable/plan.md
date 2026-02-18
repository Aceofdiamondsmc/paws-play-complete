

## Add Per-Post Author Name Override in Admin

### Problem
Many seed/demo posts share the same `author_id`, so they all display the same profile name (e.g., "Harry"). You need the ability to set a different display name per post from the Admin panel.

### Approach
Add an `author_display_name` column to the `posts` table that acts as a per-post override. When set, the social feed and admin panel will use it instead of the profile's `display_name`. This avoids modifying the actual user profile (which would affect all posts by that user).

### Changes

#### 1. Database Migration
Add a nullable `author_display_name` text column to the `posts` table:
```sql
ALTER TABLE posts ADD COLUMN author_display_name text;
```

#### 2. AdminEditPostModal -- add Author Name field
**File: `src/components/social/AdminEditPostModal.tsx`**
- Add `initialAuthorName` prop and `authorName` state
- Add an "Author Display Name" text input field (placed above Content)
- Include `author_display_name` in the update query on save

#### 3. AdminSocial -- pass author name to edit modal
**File: `src/pages/admin/AdminSocial.tsx`**
- Update the `Post` interface to include `author_display_name`
- Pass the post's `author_display_name` (or the resolved profile name as fallback) to the edit modal
- Display the override name in the table's Author column when present

#### 4. Social Feed -- prefer per-post override
**File: `src/hooks/usePosts.tsx`**
- When building enriched posts, set `author.display_name` to `post.author_display_name` if it exists, falling back to the profile's display name

### Technical Details

**Database**: Single column addition, no data migration needed. Existing posts will have `null` and continue using the profile name.

**AdminEditPostModal changes**:
- New prop: `initialAuthorName: string`
- New state: `authorName`
- New input field between the dialog title and Content textarea
- Update query adds: `author_display_name: authorName.trim() || null`

**usePosts.tsx change** (in the enriched posts mapping):
```ts
author: {
  ...profileMap.get(p.author_id),
  display_name: p.author_display_name || profileMap.get(p.author_id)?.display_name,
}
```

**AdminSocial.tsx changes**:
- `getAuthorName` checks `post.author_display_name` first
- Passes `initialAuthorName` to the edit modal using `post.author_display_name || getAuthorName(post.author_id)`

### Files Changed
- **Migration**: Add `author_display_name` column to `posts`
- `src/components/social/AdminEditPostModal.tsx` -- add author name field + save logic
- `src/pages/admin/AdminSocial.tsx` -- pass author name, display override in table
- `src/hooks/usePosts.tsx` -- prefer per-post override in feed display

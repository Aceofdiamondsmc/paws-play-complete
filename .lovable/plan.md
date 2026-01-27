

## Update Social Post Navigation to Use `dog_id`

This plan updates the Social page so that clicking on a dog's name, avatar, or the "Meet the Pup" button navigates to the dog's profile using the new `dog_id` column.

---

### Summary of Changes

1. **Update the `Post` TypeScript interface** to include the new `dog_id` field
2. **Update navigation links in `Social.tsx`** to use `dog_id` instead of `author_id`
3. **Add fallback logic** for posts that don't have a `dog_id` set (older posts)

---

### Technical Details

#### 1. Update Post Type (`src/types/index.ts`)

Add the `dog_id` field to the `Post` interface:

```typescript
export interface Post {
  id: string;
  author_id: string;
  dog_id: string | null;  // NEW - links post to a specific dog
  content: string;
  image_url: string | null;
  visibility: 'public' | 'private';
  created_at: string | null;
  updated_at: string;
}
```

#### 2. Update Navigation in Social.tsx (`src/pages/Social.tsx`)

Change all three navigation points to use `dog_id` with a fallback to `author_id`:

**Avatar click (line 170):**
```tsx
onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
```

**Author name click (line 187):**
```tsx
onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
```

**Meet the Pup button (line 276):**
```tsx
onClick={() => navigate(post.dog_id ? `/pack?dog=${post.dog_id}` : `/pack?user=${post.author_id}`)}
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/types/index.ts` | Add `dog_id: string \| null` to `Post` interface |
| `src/pages/Social.tsx` | Update 3 navigation handlers to use `dog_id` |

---

### Notes

- The navigation uses `?dog=` query parameter (vs `?user=`) to distinguish between dog-specific and user-specific profile views
- A fallback to `author_id` ensures older posts without `dog_id` still work
- The Pack page may need a future update to handle the `?dog=` parameter for direct dog profile viewing


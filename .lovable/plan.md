

## Use `pup_name` from Posts Table for Meet Button

### Overview

You've manually populated a `pup_name` column on the `posts` table. The current code ignores that field and instead looks up names from the `dogs` table. This plan updates the logic to prioritize `pup_name` directly from each post, with proper fallbacks.

---

### Changes

**1. `src/hooks/usePosts.tsx` -- Prioritize `pup_name` over dog table lookup**

Update line 113 to use `pup_name` first:

```typescript
dogName: p.pup_name || (p.dog_id ? dogByIdMap.get(p.dog_id) : dogByOwnerMap.get(p.author_id)) || null,
```

This means: use the manually set `pup_name` if it exists, otherwise fall back to the dogs table lookup.

**2. `src/pages/Social.tsx` -- Update fallback text**

Change the Meet button fallback (line 378) from `'Meet'` to `'Meet a Friend'`:

```typescript
{post.dogName ? `Meet ${post.dogName}` : 'Meet a Friend'}
```

Also update the `aria-label` fallback (line 374) to match:

```typescript
aria-label={post.dogName ? `Meet ${post.dogName}` : 'Meet a Friend'}
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/hooks/usePosts.tsx` | Prioritize `p.pup_name` in dogName enrichment |
| `src/pages/Social.tsx` | Change fallback from "Meet" to "Meet a Friend" |

No database or type changes needed -- `pup_name` is already in the `Post` type and fetched via `select('*')`.


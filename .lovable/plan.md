

## Display Dog Name on "Meet" Button

### Overview

Update the "Meet" button on each social post to show "MEET ACE" (or whatever the pup's name is) instead of just "Meet". The `pup_name` field exists in the `posts` database table but isn't currently included in the app's type definitions or data fetching.

---

### Changes

**1. `src/types/index.ts` -- Add `pup_name` to the Post type**

Add `pup_name: string | null;` to the `Post` interface so TypeScript recognizes the field.

**2. `src/hooks/usePosts.tsx` -- Already fetching `*`, no query change needed**

The hook uses `select('*')` which already returns `pup_name` from the database. No changes needed here -- TypeScript will recognize it once the type is updated.

**3. `src/pages/Social.tsx` -- Update the Meet button label**

Change the PawPrint "Meet" button (around line 375) from:

```
<span className="hidden sm:inline">Meet</span>
```

To:

```
<span className="hidden sm:inline">
  {post.pup_name ? `MEET ${post.pup_name.toUpperCase()}` : 'MEET'}
</span>
```

Also update the `aria-label` to include the pup name when available.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/types/index.ts` | Add `pup_name: string \| null` to `Post` interface |
| `src/pages/Social.tsx` | Update Meet button to show `MEET [PUP_NAME]` |

No database or hook changes required -- `select('*')` already returns `pup_name`.




## Fix: "Meet Diamond" Resolves to Wrong Dog When Name is Shared

### Root Cause

The `dogNameToIdMap` in `usePosts.tsx` maps **dog name → dog id**, but a `Map` only holds one value per key. When two different users both have a dog named "Diamond," whichever dog gets inserted into the map last wins -- and all posts with `pup_name = "Diamond"` resolve to that single dog ID, regardless of which owner authored the post.

### Fix

**File: `src/hooks/usePosts.tsx`**

Replace the name-only lookup with an **owner-scoped** lookup. Instead of `Map<name, id>`, use a composite key `Map<"authorId:name", dogId>`:

1. When fetching dogs by name for posts missing `dog_id`, also fetch `owner_id` from the dogs table.
2. Build the map with composite keys: `dogNameOwnerMap.set(\`${d.owner_id}:${d.name}\`, d.id)`.
3. During enrichment (line ~101), resolve using: `dogNameOwnerMap.get(\`${p.author_id}:${dogName}\`)` instead of just the name.

This ensures that JoJo's post about "Diamond" resolves to JoJo's dog, and Diamond-the-user's post about "Diamond" resolves to their own dog -- even though both dogs share the same name.

The existing `dogByIdMap` (id → name) for posts that already have a `dog_id` is unaffected since those use the unique ID directly.


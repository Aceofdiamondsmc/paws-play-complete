

## Fix: Pack Alert Posts Missing Dog Name in "Meet" Button

### Problem
When a Pack Alert is created, the post inserted into the `posts` table (in `useLostDogAlerts.tsx` line 77-86) does not include `dog_id` or `pup_name`. This means the social feed's "Meet" button shows generic "Meet a Friend" instead of "Meet [Dog Name]", preventing users from quickly navigating to the dog's owner profile.

### Fix

**File: `src/hooks/useLostDogAlerts.tsx`** (lines 77-86)

Add `dog_id` and `pup_name` to the post insert so the social feed can resolve the dog and display the correct name:

```tsx
const { data: post, error: postError } = await supabase
  .from('posts')
  .insert({
    author_id: user.id,
    content: postContent,
    image_url: dog?.avatar_url || null,
    visibility: 'public',
    dog_id: data.dog_id,
    pup_name: dog?.name || null,
  })
  .select()
  .single();
```

That's it. One file, two added fields. Existing alert posts without `dog_id` will continue to fall back to "Meet a Friend" via the existing resolution logic in `usePosts`.


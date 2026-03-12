

## Fix Mock Post Avatars — One-Time SQL Update

### Problem
All mock posts share Harry's `author_id` (`b7f3a702-...`) and have `author_avatar_url = NULL`. The `public_posts` view uses `COALESCE(p.author_avatar_url, pr.avatar_url)`, so every mock post falls back to Harry's **current** profile avatar — meaning all 20+ mock "users" show Harry's face.

### Solution
Run a one-time SQL UPDATE to set a unique `author_avatar_url` on each mock post based on its `author_display_name`. Use the [UI Avatars](https://ui-avatars.com) service to generate distinct, colorful initials-based avatars for each fake user name (e.g., `https://ui-avatars.com/api/?name=Samantha&background=random&size=200`).

Also fix Harry's own post (`578adb4e-...`) which has `author_display_name = NULL` and `pup_name = NULL` — set display name to "Harry" and pup_name to "Banky".

### SQL to execute (via insert tool, not migration)

```sql
-- Set unique avatar per mock display name on Harry's mock posts
UPDATE posts 
SET author_avatar_url = 'https://ui-avatars.com/api/?name=' || replace(author_display_name, ' ', '+') || '&background=random&size=200&bold=true'
WHERE author_id = 'b7f3a702-a508-4fe9-8447-daee5d11acba'
  AND author_display_name IS NOT NULL
  AND author_avatar_url IS NULL;

-- Fix Harry's own post (missing display name and pup name)
UPDATE posts 
SET author_display_name = 'Harry',
    author_avatar_url = (SELECT avatar_url FROM profiles WHERE id = 'b7f3a702-a508-4fe9-8447-daee5d11acba'),
    pup_name = 'Banky'
WHERE id = '578adb4e-fc2c-4b24-aff9-57fcf91e73e4';
```

### Also fix other NULL-avatar posts from real users
Posts from Jaden (`61791abe-...`), YahYah (`00de1e2e-...`), Bella (`70a9b510-...`), and the Paws Play Repeat Team post (`b95c0ecd-...`) also have NULL `author_avatar_url`. Snapshot their current profile avatars:

```sql
UPDATE posts p
SET author_avatar_url = pr.avatar_url
FROM profiles pr
WHERE p.author_id = pr.id
  AND p.author_avatar_url IS NULL
  AND p.author_id != 'b7f3a702-a508-4fe9-8447-daee5d11acba';
```

### Result
- Each mock post gets a unique colored-initials avatar matching its display name
- Harry's own post shows his real avatar and "Banky" as the pup name
- Other real users' posts get their current profile avatar frozen in
- Future profile changes will never cascade to old posts (already fixed in code)

### Files changed
None — data-only fix via SQL.


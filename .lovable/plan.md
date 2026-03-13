

## Fix Mock Post Navigation and Missing Avatars

### Problems Found

1. **All mock posts navigate to Harry's Pack profile** -- Every mock post shares the same `author_id` (`b7f3a702...` = Harry's real account). Since `dog_id` is null on all mock posts, clicking any mock post's avatar/name navigates to `/pack?user=b7f3a702` (Harry).

2. **Harry and Samantha posts lost their avatar snapshots** -- Two posts (`578adb4e` for Harry, `d945311c` for Samantha) have `author_avatar_url = NULL`. When edited, the snapshot was cleared. The `public_posts` view then falls back to Harry's real profile avatar, making Samantha show Harry's photo.

### Fix

| Change | Detail |
|--------|--------|
| **SQL migration** | Set `author_avatar_url` to ui-avatars URLs for the 2 posts with null avatars (Harry and Samantha) |
| **Social.tsx** | When a post has `author_display_name` set (admin/mock post, shown with the shield icon), disable navigation on avatar and name clicks -- these aren't real user profiles to navigate to |

### SQL

```sql
UPDATE posts SET author_avatar_url = 'https://ui-avatars.com/api/?name=Harry&background=random&size=200&bold=true'
WHERE id = '578adb4e-fc2c-4b24-aff9-57fcf91e73e4';

UPDATE posts SET author_avatar_url = 'https://ui-avatars.com/api/?name=Samantha&background=random&size=200&bold=true'
WHERE id = 'd945311c-882e-433c-b6c0-067ba521c208';
```

### Code (Social.tsx)

For both the avatar button (line ~415) and name button (line ~432), wrap in a condition: if `post.author_display_name` is set, render as a non-clickable element instead of a navigation button. This prevents all admin/mock posts from linking to Harry's profile while keeping real user posts navigable.


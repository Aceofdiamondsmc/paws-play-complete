
-- Fix remaining NULL-avatar posts (mock user with no profile)
UPDATE posts 
SET author_avatar_url = 'https://ui-avatars.com/api/?name=' || replace(COALESCE(author_display_name, 'User'), ' ', '+') || '&background=random&size=200&bold=true'
WHERE author_avatar_url IS NULL
  AND author_display_name IS NOT NULL;

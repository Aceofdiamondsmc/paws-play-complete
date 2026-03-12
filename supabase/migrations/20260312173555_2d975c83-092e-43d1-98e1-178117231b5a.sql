
-- One-time fix: snapshot avatars on all existing posts with NULL author_avatar_url

-- 1) Mock posts under Harry's author_id: generate unique initials avatars
UPDATE posts 
SET author_avatar_url = 'https://ui-avatars.com/api/?name=' || replace(author_display_name, ' ', '+') || '&background=random&size=200&bold=true'
WHERE author_id = 'b7f3a702-a508-4fe9-8447-daee5d11acba'
  AND author_display_name IS NOT NULL
  AND author_avatar_url IS NULL;

-- 2) Fix Harry's own post: set display name, real avatar, and pup name
UPDATE posts 
SET author_display_name = 'Harry',
    author_avatar_url = (SELECT avatar_url FROM profiles WHERE id = 'b7f3a702-a508-4fe9-8447-daee5d11acba'),
    pup_name = 'Banky'
WHERE id = '578adb4e-fc2c-4b24-aff9-57fcf91e73e4';

-- 3) All other real users: snapshot their current profile avatar
UPDATE posts p
SET author_avatar_url = pr.avatar_url
FROM profiles pr
WHERE p.author_id = pr.id
  AND p.author_avatar_url IS NULL
  AND p.author_id != 'b7f3a702-a508-4fe9-8447-daee5d11acba';

-- Restore missing avatar snapshots for Harry and Samantha mock posts
UPDATE posts SET author_avatar_url = 'https://ui-avatars.com/api/?name=Harry&background=random&size=200&bold=true'
WHERE id = '578adb4e-fc2c-4b24-aff9-57fcf91e73e4';

UPDATE posts SET author_avatar_url = 'https://ui-avatars.com/api/?name=Samantha&background=random&size=200&bold=true'
WHERE id = 'd945311c-882e-433c-b6c0-067ba521c208';
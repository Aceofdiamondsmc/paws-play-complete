-- Delete duplicate park entry (Id 261, no added_by)
DELETE FROM parks WHERE "Id" = 261;

-- Set coordinates for Exploration Peak Park (Id 262)
UPDATE parks 
SET latitude = 36.0116, longitude = -115.2458
WHERE "Id" = 262;
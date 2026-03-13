-- Delete 13 duplicate Washington state parks (keeping lower-ID originals)
DELETE FROM parks WHERE "Id" IN (176, 177, 178, 179, 180, 181, 182, 183, 184, 185, 186, 187, 190);
-- Replace all remaining broken dog.ceo URLs with reliable Unsplash dog images
-- Using a deterministic mapping based on content keywords

UPDATE posts SET image_url = CASE
  WHEN content ILIKE '%fetch%' THEN 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop'
  WHEN content ILIKE '%beach%' THEN 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600&h=600&fit=crop'
  WHEN content ILIKE '%squirrel%' THEN 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=600&fit=crop'
  WHEN content ILIKE '%nap%' OR content ILIKE '%sleep%' THEN 'https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=600&h=600&fit=crop'
  WHEN content ILIKE '%snack%' OR content ILIKE '%treat%' THEN 'https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=600&h=600&fit=crop'
  WHEN content ILIKE '%groom%' OR content ILIKE '%glow%' THEN 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=600&fit=crop'
  WHEN content ILIKE '%patrol%' OR content ILIKE '%duty%' THEN 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop'
  WHEN content ILIKE '%tug%' OR content ILIKE '%war%' THEN 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=600&fit=crop'
  WHEN content ILIKE '%sock%' OR content ILIKE '%caught%' THEN 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=600&fit=crop'
  WHEN content ILIKE '%selfie%' OR content ILIKE '%sit%stay%' THEN 'https://images.unsplash.com/photo-1612536057832-2ff7ead58194?w=600&h=600&fit=crop'
  WHEN content ILIKE '%trail%' OR content ILIKE '%mud%' THEN 'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=600&h=600&fit=crop'
  WHEN content ILIKE '%train%' THEN 'https://images.unsplash.com/photo-1594149929911-78975a43d4f5?w=600&h=600&fit=crop'
  WHEN content ILIKE '%puppuccino%' OR content ILIKE '%cafe%' OR content ILIKE '%coffee%' THEN 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&h=600&fit=crop'
  WHEN content ILIKE '%winter%' OR content ILIKE '%snow%' THEN 'https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=600&h=600&fit=crop'
  WHEN content ILIKE '%blanket%' OR content ILIKE '%cozy%' THEN 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=600&h=600&fit=crop'
  WHEN content ILIKE '%pack%' OR content ILIKE '%friend%' THEN 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=600&h=600&fit=crop'
  WHEN content ILIKE '%paw%' THEN 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=600&fit=crop'
  WHEN content ILIKE '%chaos%' THEN 'https://images.unsplash.com/photo-1535930749574-1399327ce78f?w=600&h=600&fit=crop'
  WHEN content ILIKE '%bella%' OR content ILIKE '%meet%' THEN 'https://images.unsplash.com/photo-1579213838058-4a5765e6ecf4?w=600&h=600&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=600&fit=crop'
END
WHERE image_url LIKE '%dog.ceo%';
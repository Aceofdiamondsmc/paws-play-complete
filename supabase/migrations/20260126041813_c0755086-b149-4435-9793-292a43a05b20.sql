-- Update services with high-quality curated Unsplash images based on category
UPDATE services 
SET image_url = CASE category
  WHEN 'Dog Walkers' THEN 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop'
  WHEN 'Groomers' THEN 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=800&h=600&fit=crop'
  WHEN 'Vet Clinics' THEN 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=800&h=600&fit=crop'
  WHEN 'Trainers' THEN 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=800&h=600&fit=crop'
  WHEN 'Daycare' THEN 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&h=600&fit=crop'
  ELSE 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=600&fit=crop'
END
WHERE image_url IS NULL;
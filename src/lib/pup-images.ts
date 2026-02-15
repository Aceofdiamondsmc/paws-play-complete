// Consistent image mapping per pup name
// Each dog gets one stable photo so they look the same across all posts

const PUP_IMAGE_MAP: Record<string, string> = {
  'Ace': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop',
  'Bella': 'https://images.unsplash.com/photo-1587564703167-1962c425a581?w=600&h=600&fit=crop',
  'Max': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=600&fit=crop',
  'Milo': 'https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=600&h=600&fit=crop',
  'Luna': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=600&fit=crop',
  'Daisy': 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=600&fit=crop',
  'Charlie': 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&h=600&fit=crop',
  'Cooper': 'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=600&fit=crop',
  'Rosie': 'https://images.unsplash.com/photo-1579213838058-4a5765e6ecf4?w=600&h=600&fit=crop',
  'Duke': 'https://images.unsplash.com/photo-1546975490-e8b92a360b24?w=600&h=600&fit=crop',
  'Sadie': 'https://images.unsplash.com/photo-1586671267731-da2cf3ceeb80?w=600&h=600&fit=crop',
  'Bear': 'https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=600&h=600&fit=crop',
  'Tucker': 'https://images.unsplash.com/photo-1601758003122-53c40e686a19?w=600&h=600&fit=crop',
  'Rocky': 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=600&h=600&fit=crop',
  'Penny': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=600&h=600&fit=crop',
  'Zeus': 'https://images.unsplash.com/photo-1594149929911-78975a43d4f5?w=600&h=600&fit=crop',
  'Lola': 'https://images.unsplash.com/photo-1591769225440-811ad7d6eab3?w=600&h=600&fit=crop',
  'Bailey': 'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&h=600&fit=crop',
};

/**
 * Returns a consistent image URL for a given pup name.
 * Only replaces broken Unsplash "generic" images or dog.ceo URLs.
 * User-uploaded images are left untouched.
 */
export function getPupImage(pupName: string | null | undefined, currentImageUrl: string | null | undefined): string | null | undefined {
  // Don't replace user-uploaded images (from supabase storage)
  if (currentImageUrl && currentImageUrl.includes('supabase')) {
    return currentImageUrl;
  }

  if (!pupName) return currentImageUrl;

  // Check for exact match first, then case-insensitive
  const match = PUP_IMAGE_MAP[pupName] || PUP_IMAGE_MAP[Object.keys(PUP_IMAGE_MAP).find(k => k.toLowerCase() === pupName.toLowerCase()) || ''];
  
  return match || currentImageUrl;
}

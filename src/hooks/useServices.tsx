import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Service {
  id: number;
  name: string;
  category: string;
  rating: number;
  price: string;
  distance: string | null;
  description: string | null;
  enriched_description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_verified: boolean;
  is_flagged: boolean;
  latitude: number | null;
  longitude: number | null;
  verified_latitude: number | null;
  verified_longitude: number | null;
  enrichment_status: 'pending' | 'processing' | 'completed' | 'failed';
  verified_address: string | null;
  phone: string | null;
  website: string | null;
  photo_reference: string | null;
}

// Google Maps API key for Places photos - uses environment variable for security
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Fallback images by category from Unsplash
const FALLBACK_IMAGES: Record<string, string> = {
  'Dog Walkers': 'https://placedog.net/600/400?id=walk',
  'Daycare': 'https://placedog.net/600/400?id=service',
  'Vet Clinics': 'https://placedog.net/600/400?id=service',
  'Trainers': 'https://placedog.net/600/400?id=train',
  'Groomers': 'https://placedog.net/600/400?id=groom',
};

// Check if a URL is likely broken or generic
function isValidImageUrl(url: string | null): boolean {
  if (!url) return false;
  
  // Known broken domain patterns
  const brokenPatterns = [
    'petworks.com',
    'example.com',
    'placeholder',
    'via.placeholder',
    'dummyimage',
  ];
  
  if (brokenPatterns.some(pattern => url.toLowerCase().includes(pattern))) {
    return false;
  }
  
  return true;
}

export function getServiceImage(service: Service): string {
  // Priority 1: Supabase Storage URLs (generated images)
  if (service.image_url?.includes('supabase')) {
    return service.image_url;
  }
  
  // Priority 2: Valid external image_url
  if (isValidImageUrl(service.image_url)) {
    return service.image_url!;
  }
  
  // Priority 3: Google Places photo_reference if available
  if (service.photo_reference && !service.photo_reference.startsWith('Aap_uE') && GOOGLE_API_KEY) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${service.photo_reference}&key=${GOOGLE_API_KEY}`;
  }
  
  // Fallback: category-based stock photos
  return FALLBACK_IMAGES[service.category] || 'https://placedog.net/600/400?id=service';
}

export function useServices(category?: string | null) {
  return useQuery({
    queryKey: ['services', category],
    queryFn: async () => {
      let query = supabase
        .from('services')
        .select('*')
        .order('is_featured', { ascending: false })
        .order('rating', { ascending: false });

      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as Service[];
    },
  });
}

// Format distance in meters to human-readable format
function formatDistanceForDisplay(meters: number | null | undefined): string | null {
  if (meters == null) return null;
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    return `${Math.round(meters)}m away`;
  }
  if (miles < 10) {
    return `${miles.toFixed(1)} mi away`;
  }
  return `${Math.round(miles)} mi away`;
}

export function useNearbyServices(
  coords: { latitude: number; longitude: number } | null,
  category?: string | null
) {
  return useQuery({
    queryKey: ['nearby-services', coords?.latitude, coords?.longitude, category],
    queryFn: async () => {
      if (!coords) return null;

      const { data, error } = await (supabase.rpc as any)('get_nearby_services', {
        user_lat: coords.latitude,
        user_lng: coords.longitude,
        radius_meters: 40000,
        filter_category: category || null
      });

      if (error) throw error;

      return (data as any[]).map(row => ({
        ...row,
        distance: formatDistanceForDisplay(row.distance_meters)
      })) as Service[];
    },
    enabled: !!coords,
  });
}

export function useService(id: string | undefined) {
  return useQuery({
    queryKey: ['service', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) throw error;
      return data as Service;
    },
    enabled: !!id,
  });
}

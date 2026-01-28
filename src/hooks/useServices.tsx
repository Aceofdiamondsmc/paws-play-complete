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
  phone: string | null;
  website: string | null;
  photo_reference: string | null;
}

// Google Maps API key for Places photos - uses environment variable for security
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

// Fallback images by category from Unsplash
const FALLBACK_IMAGES: Record<string, string> = {
  'Dog Walkers': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  'Daycare': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
  'Vet Clinics': 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=300&fit=crop',
  'Trainers': 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&h=300&fit=crop',
  'Groomers': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop',
};

export function getServiceImage(service: Service): string {
  // Priority 1: Use image_url from database if it exists
  if (service.image_url) {
    return service.image_url;
  }
  // Priority 2: Use Google Places photo_reference if available
  if (service.photo_reference && !service.photo_reference.startsWith('Aap_uE')) {
    return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${service.photo_reference}&key=${GOOGLE_API_KEY}`;
  }
  // Fallback: category-based stock photos
  return FALLBACK_IMAGES[service.category] || 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop';
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

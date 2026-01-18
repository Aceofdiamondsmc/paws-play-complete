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
  image_url: string | null;
  is_featured: boolean;
  latitude: number | null;
  longitude: number | null;
}

// Fallback images by category from Unsplash
const FALLBACK_IMAGES: Record<string, string> = {
  'Dog Walkers': 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=300&fit=crop',
  'Daycare': 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=300&fit=crop',
  'Vet Clinics': 'https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=400&h=300&fit=crop',
  'Trainers': 'https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&h=300&fit=crop',
  'Groomers': 'https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?w=400&h=300&fit=crop',
};

export function getServiceImage(service: Service): string {
  if (service.image_url) return service.image_url;
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

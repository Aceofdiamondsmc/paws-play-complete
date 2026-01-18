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

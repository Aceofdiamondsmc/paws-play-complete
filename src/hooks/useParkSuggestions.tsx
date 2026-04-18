import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export interface ParkSuggestion {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  image_url: string | null;
  is_fully_fenced: boolean;
  has_water_station: boolean;
  has_small_dog_area: boolean;
  has_large_dog_area: boolean;
  has_agility_equipment: boolean;
  has_parking: boolean;
  has_grass_surface: boolean;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
}

export interface ParkSuggestionInput {
  name: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
  description?: string;
  latitude?: number | null;
  longitude?: number | null;
  is_fully_fenced?: boolean;
  has_water_station?: boolean;
  has_small_dog_area?: boolean;
  has_large_dog_area?: boolean;
  has_agility_equipment?: boolean;
  has_parking?: boolean;
  has_grass_surface?: boolean;
}

export function useParkSuggestions() {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState<ParkSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  // User's own suggestions via react-query
  const { data: mySuggestions = [], isLoading: mySuggestionsLoading, refetch: refetchMySuggestions } = useQuery({
    queryKey: ['my-park-suggestions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('park_suggestions')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as ParkSuggestion[];
    },
    enabled: !!user?.id,
  });

  const fetchPendingSuggestions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('park_suggestions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (!error && data) setSuggestions(data as ParkSuggestion[]);
    setLoading(false);
  }, []);

  const submitSuggestion = async (input: ParkSuggestionInput) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('park_suggestions')
      .insert({
        user_id: user.id,
        name: input.name,
        address: input.address || null,
        city: input.city || null,
        state: input.state || null,
        zip_code: input.zip_code || null,
        country: input.country || 'United States',
        description: input.description || null,
        latitude: input.latitude ?? null,
        longitude: input.longitude ?? null,
        is_fully_fenced: input.is_fully_fenced ?? false,
        has_water_station: input.has_water_station ?? false,
        has_small_dog_area: input.has_small_dog_area ?? false,
        has_large_dog_area: input.has_large_dog_area ?? false,
        has_agility_equipment: input.has_agility_equipment ?? false,
        has_parking: input.has_parking ?? false,
        has_grass_surface: input.has_grass_surface ?? false,
      });

    return { error };
  };

  const approveSuggestion = async (id: string) => {
    const { error } = await supabase.rpc('approve_park_suggestion', { suggestion_id: id });
    if (!error) await fetchPendingSuggestions();
    return { error };
  };

  const rejectSuggestion = async (id: string, adminNotes?: string) => {
    const { error } = await supabase
      .from('park_suggestions')
      .update({
        status: 'rejected',
        admin_notes: adminNotes || null,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (!error) await fetchPendingSuggestions();
    return { error };
  };

  return {
    suggestions,
    loading,
    fetchPendingSuggestions,
    submitSuggestion,
    approveSuggestion,
    rejectSuggestion,
    mySuggestions,
    mySuggestionsLoading,
    refetchMySuggestions,
  };
}

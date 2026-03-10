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
    // Fetch the suggestion first
    const { data: suggestion, error: fetchError } = await supabase
      .from('park_suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !suggestion) return { error: fetchError || new Error('Not found') };

    const s = suggestion as ParkSuggestion;

    // Get next park ID
    const { data: maxIdData } = await supabase
      .from('parks')
      .select('Id')
      .order('Id', { ascending: false })
      .limit(1)
      .single();

    const nextId = ((maxIdData as any)?.Id || 0) + 1;

    // Insert into parks table
    const { error: insertError } = await supabase
      .from('parks')
      .insert({
        Id: nextId,
        name: s.name,
        address: s.address,
        city: s.city,
        state: s.state,
        description: s.description,
        latitude: s.latitude,
        longitude: s.longitude,
        image_url: s.image_url,
        is_fully_fenced: s.is_fully_fenced,
        has_water_station: s.has_water_station,
        has_small_dog_area: s.has_small_dog_area,
        has_large_dog_area: s.has_large_dog_area,
        has_agility_equipment: s.has_agility_equipment,
        has_parking: s.has_parking,
        has_grass_surface: s.has_grass_surface,
        is_dog_friendly: true,
      });

    if (insertError) return { error: insertError };

    // Mark suggestion as approved
    const { error: updateError } = await supabase
      .from('park_suggestions')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', id);

    if (!updateError) await fetchPendingSuggestions();
    return { error: updateError };
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
  };
}

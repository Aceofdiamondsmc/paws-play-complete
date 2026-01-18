import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface PlayStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export function usePlayStyles() {
  const [playStyles, setPlayStyles] = useState<PlayStyle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStyles = async () => {
      try {
        const { data, error } = await supabase
          .from('play_styles')
          .select('*')
          .order('name');

        if (error) throw error;
        setPlayStyles((data || []) as PlayStyle[]);
      } catch (e) {
        console.error('Error fetching play styles:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchStyles();
  }, []);

  return { playStyles, loading };
}

export function useDogPlayStyles(dogId?: string) {
  const { user } = useAuth();
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDogStyles = useCallback(async () => {
    if (!dogId) {
      setSelectedStyles([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('dog_play_styles')
        .select('play_style_id')
        .eq('dog_id', dogId);

      if (error) throw error;
      setSelectedStyles((data || []).map(d => d.play_style_id));
    } catch (e) {
      console.error('Error fetching dog play styles:', e);
    } finally {
      setLoading(false);
    }
  }, [dogId]);

  useEffect(() => {
    fetchDogStyles();
  }, [fetchDogStyles]);

  const updateDogStyles = async (styleIds: string[]) => {
    if (!user || !dogId) return { error: new Error('Not ready') };

    try {
      // Remove existing styles
      await supabase
        .from('dog_play_styles')
        .delete()
        .eq('dog_id', dogId);

      // Add new styles
      if (styleIds.length > 0) {
        const { error } = await supabase
          .from('dog_play_styles')
          .insert(styleIds.map(styleId => ({
            dog_id: dogId,
            play_style_id: styleId
          })));

        if (error) throw error;
      }

      setSelectedStyles(styleIds);
      return { error: null };
    } catch (e) {
      console.error('Error updating dog play styles:', e);
      return { error: e as Error };
    }
  };

  return {
    selectedStyles,
    loading,
    updateDogStyles,
    refresh: fetchDogStyles
  };
}

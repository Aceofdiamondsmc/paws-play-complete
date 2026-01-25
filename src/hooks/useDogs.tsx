import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface DogData {
  name: string;
  breed?: string;
  size?: string;
  energy?: string;
  energy_level?: string;
  bio?: string;
  avatar_url?: string;
  age_years?: number;
  weight_lbs?: number;
  health_notes?: string;
  play_style?: string[];
}

export function useDogs() {
  const { user, refreshDogs } = useAuth();

  const addDog = async (data: DogData) => {
    if (!user) return { dog: null, error: new Error('Not authenticated') };

    // Explicitly get owner_id from authenticated user
    const ownerId = user.id;
    if (!ownerId) return { dog: null, error: new Error('User ID not found') };

    try {
      const insertData = {
        owner_id: ownerId,
        name: data.name,
        breed: data.breed || '',
        size: data.size || 'Medium',
        energy: data.energy || 'Medium',
        energy_level: data.energy_level || data.energy || 'Medium',
        bio: data.bio || '',
        avatar_url: data.avatar_url || null,
        age_years: data.age_years || null,
        weight_lbs: data.weight_lbs || null,
        health_notes: data.health_notes || null,
        play_style: Array.isArray(data.play_style) ? data.play_style : []
      };

      const { data: dog, error } = await supabase
        .from('dogs')
        .insert(insertData)
        .select()
        .maybeSingle(); // Use maybeSingle to avoid PGRST204 error

      if (error) throw error;

      await refreshDogs();
      return { dog, error: null };
    } catch (e) {
      console.error('Error adding dog:', e);
      return { dog: null, error: e as Error };
    }
  };

  const updateDog = async (dogId: string, data: Partial<DogData>) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Explicitly map fields to match the database schema
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };
      
      if (data.name !== undefined) updateData.name = data.name;
      if (data.breed !== undefined) updateData.breed = data.breed;
      if (data.size !== undefined) updateData.size = data.size;
      if (data.energy !== undefined) updateData.energy = data.energy;
      if (data.energy_level !== undefined) updateData.energy_level = data.energy_level;
      if (data.bio !== undefined) updateData.bio = data.bio;
      if (data.avatar_url !== undefined) updateData.avatar_url = data.avatar_url;
      if (data.age_years !== undefined) updateData.age_years = data.age_years;
      if (data.weight_lbs !== undefined) updateData.weight_lbs = data.weight_lbs;
      if (data.health_notes !== undefined) updateData.health_notes = data.health_notes;
      if (data.play_style !== undefined) updateData.play_style = data.play_style;

      const { error } = await supabase
        .from('dogs')
        .update(updateData)
        .eq('id', dogId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await refreshDogs();
      return { error: null };
    } catch (e) {
      console.error('Error updating dog:', e);
      return { error: e as Error };
    }
  };

  const deleteDog = async (dogId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('dogs')
        .delete()
        .eq('id', dogId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await refreshDogs();
      return { error: null };
    } catch (e) {
      console.error('Error deleting dog:', e);
      return { error: e as Error };
    }
  };

  const uploadDogAvatar = async (dogId: string, file: File) => {
    if (!user) return { url: null, error: new Error('Not authenticated') };

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${dogId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(filePath);

      // Update dog avatar
      await updateDog(dogId, { avatar_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (e) {
      console.error('Error uploading dog avatar:', e);
      return { url: null, error: e as Error };
    }
  };

  /**
   * Filter dogs by play style using Supabase .contains() method
   * This leverages the GIN index on the play_style array column
   * @param playStyles - Array of play styles to filter by (dogs must have ALL specified styles)
   * @param limit - Maximum number of results to return
   */
  const filterDogsByPlayStyle = async (playStyles: string[], limit: number = 20) => {
    try {
      let query = supabase
        .from('dogs')
        .select('*');

      // Use .contains() to filter by play_style array - hits GIN index
      if (playStyles.length > 0) {
        query = query.contains('play_style', playStyles);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;
      return { dogs: data, error: null };
    } catch (e) {
      console.error('Error filtering dogs by play style:', e);
      return { dogs: null, error: e as Error };
    }
  };

  /**
   * Get dogs that have ANY of the specified play styles
   * Uses .overlaps() for "OR" matching instead of "AND" matching
   */
  const filterDogsByAnyPlayStyle = async (playStyles: string[], limit: number = 20) => {
    try {
      let query = supabase
        .from('dogs')
        .select('*');

      // Use .overlaps() to find dogs with ANY of the specified styles
      if (playStyles.length > 0) {
        query = query.overlaps('play_style', playStyles);
      }

      const { data, error } = await query.limit(limit);

      if (error) throw error;
      return { dogs: data, error: null };
    } catch (e) {
      console.error('Error filtering dogs by play style:', e);
      return { dogs: null, error: e as Error };
    }
  };

  return {
    addDog,
    updateDog,
    deleteDog,
    uploadDogAvatar,
    filterDogsByPlayStyle,
    filterDogsByAnyPlayStyle
  };
}

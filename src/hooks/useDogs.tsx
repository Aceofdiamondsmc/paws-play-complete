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
  health_info?: string;
}

export function useDogs() {
  const { user, refreshDogs } = useAuth();

  const addDog = async (data: DogData) => {
    if (!user) return { dog: null, error: new Error('Not authenticated') };

    try {
      const { data: dog, error } = await supabase
        .from('dogs')
        .insert({
          owner_id: user.id,
          name: data.name,
          breed: data.breed || '',
          size: data.size || 'Medium',
          energy: data.energy || 'Medium',
          energy_level: data.energy_level || data.energy || 'Medium',
          bio: data.bio || '',
          avatar_url: data.avatar_url || null,
          age_years: data.age_years || null,
          weight_lbs: data.weight_lbs || null,
          health_info: data.health_info || null
        })
        .select()
        .single();

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
      const { error } = await supabase
        .from('dogs')
        .update({
          ...data,
          updated_at: new Date().toISOString()
        })
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

  return {
    addDog,
    updateDog,
    deleteDog,
    uploadDogAvatar
  };
}

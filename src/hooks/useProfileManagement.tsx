import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface ProfileData {
  display_name?: string;
  username?: string;
  bio?: string;
  city?: string;
  state?: string;
  avatar_url?: string;
  location_public?: boolean;
}

export function useProfile() {
  const { user, refreshProfile } = useAuth();

  const updateProfile = async (data: ProfileData) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Filter out undefined values to avoid overwriting existing data with null
      const cleanData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined) {
          cleanData[key] = value;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(cleanData)
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      return { error: null };
    } catch (e) {
      console.error('Error updating profile:', e);
      return { error: e as Error };
    }
  };

  const uploadAvatar = async (file: File) => {
    if (!user) return { url: null, error: new Error('Not authenticated') };

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('user-profiles')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('user-profiles')
        .getPublicUrl(filePath);

      // Update profile avatar
      await updateProfile({ avatar_url: publicUrl });

      return { url: publicUrl, error: null };
    } catch (e) {
      console.error('Error uploading avatar:', e);
      return { url: null, error: e as Error };
    }
  };

  const completeOnboarding = async () => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      await refreshProfile();
      return { error: null };
    } catch (e) {
      console.error('Error completing onboarding:', e);
      return { error: e as Error };
    }
  };

  return {
    updateProfile,
    uploadAvatar,
    completeOnboarding
  };
}

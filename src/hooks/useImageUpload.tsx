import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface UploadResult {
  url: string | null;
  error: Error | null;
}

export function useImageUpload() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File, bucket: string = 'post-images'): Promise<UploadResult> => {
    if (!user) {
      return { url: null, error: new Error('Must be logged in to upload images') };
    }

    try {
      setUploading(true);

      // Create unique file path: userId/timestamp-randomstring.extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return { url: publicUrl, error: null };
    } catch (error) {
      console.error('Upload error:', error);
      return { url: null, error: error as Error };
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string, bucket: string = 'post-images'): Promise<{ error: Error | null }> => {
    if (!user) {
      return { error: new Error('Must be logged in to delete images') };
    }

    try {
      // Extract file path from URL
      const urlParts = url.split(`${bucket}/`);
      if (urlParts.length < 2) {
        throw new Error('Invalid image URL');
      }
      const filePath = urlParts[1];

      const { error } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (error) throw error;

      return { error: null };
    } catch (error) {
      console.error('Delete error:', error);
      return { error: error as Error };
    }
  };

  return {
    uploadImage,
    deleteImage,
    uploading,
  };
}

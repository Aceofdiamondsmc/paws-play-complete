import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { playReunitedSound } from '@/lib/alert-sounds';
export interface LostDogAlert {
  id: string;
  user_id: string;
  dog_id: string;
  status: string;
  description: string | null;
  last_seen_location: string | null;
  last_seen_lat: number | null;
  last_seen_lng: number | null;
  contact_phone: string | null;
  post_id: string | null;
  created_at: string;
  resolved_at: string | null;
  dog?: { name: string; avatar_url: string | null; breed: string | null };
}

export function useLostDogAlerts() {
  const { user } = useAuth();
  const [activeAlerts, setActiveAlerts] = useState<LostDogAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActiveAlerts = async () => {
    const { data, error } = await supabase
      .from('lost_dog_alerts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Fetch dog info for each alert
      const dogIds = [...new Set(data.map(a => a.dog_id))];
      const { data: dogs } = await supabase
        .from('dogs')
        .select('id, name, avatar_url, breed')
        .in('id', dogIds);

      const dogMap = new Map(dogs?.map(d => [d.id, d]) || []);
      
      setActiveAlerts(data.map(alert => ({
        ...alert,
        dog: dogMap.get(alert.dog_id) || undefined,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchActiveAlerts();
  }, []);

  const createAlert = async (data: {
    dog_id: string;
    description: string;
    last_seen_location: string;
    last_seen_lat?: number;
    last_seen_lng?: number;
    contact_phone: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      // Get dog info for the post
      const { data: dog } = await supabase
        .from('dogs')
        .select('name, avatar_url, breed')
        .eq('id', data.dog_id)
        .single();

      // Create the Social post
      const postContent = `🚨 PAWS ALERT: Missing Member! 🚨\n\n${dog?.name || 'A dog'} (${dog?.breed || 'Unknown breed'}) is missing!\n\n📍 Last seen: ${data.last_seen_location}\n📝 ${data.description}\n📞 Contact: ${data.contact_phone}\n\nOur pack needs your eyes on the street. Please share! 🐾`;

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          content: postContent,
          image_url: dog?.avatar_url || null,
          visibility: 'public',
        })
        .select()
        .single();

      if (postError) throw postError;

      // Create the alert record
      const { error: alertError } = await supabase
        .from('lost_dog_alerts')
        .insert({
          user_id: user.id,
          dog_id: data.dog_id,
          description: data.description,
          last_seen_location: data.last_seen_location,
          last_seen_lat: data.last_seen_lat || null,
          last_seen_lng: data.last_seen_lng || null,
          contact_phone: data.contact_phone,
          post_id: post?.id || null,
        });

      if (alertError) throw alertError;

      // Try to send push notification via edge function
      try {
        await supabase.functions.invoke('lost-dog-alert', {
          body: {
            dog_name: dog?.name,
            last_seen: data.last_seen_location,
            description: data.description,
          },
        });
      } catch (e) {
        console.warn('Push notification failed, alert still created:', e);
      }

      await fetchActiveAlerts();
      return { error: null };
    } catch (e) {
      return { error: e as Error };
    }
  };

  const resolveAlert = async (alertId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Get alert info for the reunited notification
    const alert = activeAlerts.find(a => a.id === alertId);

    const { error } = await supabase
      .from('lost_dog_alerts')
      .update({ status: 'reunited', resolved_at: new Date().toISOString() })
      .eq('id', alertId)
      .eq('user_id', user.id);

    if (!error) {
      playReunitedSound();

      // Send reunited push notification
      try {
        await supabase.functions.invoke('lost-dog-alert', {
          body: {
            type: 'reunited',
            dog_name: alert?.dog?.name,
          },
        });
      } catch (e) {
        console.warn('Reunited push notification failed:', e);
      }

      await fetchActiveAlerts();
    }
    return { error };
  };
  return { activeAlerts, loading, createAlert, resolveAlert, refresh: fetchActiveAlerts };
}

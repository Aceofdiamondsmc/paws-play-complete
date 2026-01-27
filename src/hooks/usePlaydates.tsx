import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { PlaydateRequest, Dog, Profile } from '@/types';

interface PlaydateWithDetails extends PlaydateRequest {
  senderDog?: Dog;
  receiverDog?: Dog;
  requesterProfile?: Profile;
}

export function usePlaydates() {
  const { user, dogs } = useAuth();
  const [playdates, setPlaydates] = useState<PlaydateWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlaydates = useCallback(async () => {
    if (!user || dogs.length === 0) return;

    try {
      setLoading(true);

      const dogIds = dogs.map(d => d.id);

      // Fetch playdates where user's dogs are involved
      const { data, error } = await supabase
        .from('playdate_requests')
        .select('*')
        .or(`sender_dog_id.in.(${dogIds.join(',')}),receiver_dog_id.in.(${dogIds.join(',')})`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get unique dog IDs and requester IDs for additional info
      const allDogIds = new Set<string>();
      const requesterIds = new Set<string>();

      data?.forEach((p: PlaydateRequest) => {
        if (p.sender_dog_id) allDogIds.add(p.sender_dog_id);
        if (p.receiver_dog_id) allDogIds.add(p.receiver_dog_id);
        if (p.requester_id) requesterIds.add(p.requester_id);
      });

      // Fetch dogs
      const { data: dogsData } = await supabase
        .from('dogs')
        .select('*')
        .in('id', Array.from(allDogIds));

      // Fetch profiles (use profiles_safe view for authenticated access)
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles_safe')
        .select('*')
        .in('id', Array.from(requesterIds));

      if (profilesError) {
        console.error('Error fetching profiles (session may have expired):', profilesError);
      }

      const dogMap = new Map<string, Dog>();
      dogsData?.forEach((d: Dog) => dogMap.set(d.id, d));

      const profileMap = new Map<string, Profile>();
      profilesData?.forEach((p: Profile) => profileMap.set(p.id, p));

      // Enrich playdates with details
      const enrichedPlaydates: PlaydateWithDetails[] = (data || []).map((p: PlaydateRequest) => ({
        ...p,
        senderDog: p.sender_dog_id ? dogMap.get(p.sender_dog_id) : undefined,
        receiverDog: p.receiver_dog_id ? dogMap.get(p.receiver_dog_id) : undefined,
        requesterProfile: p.requester_id ? profileMap.get(p.requester_id) : undefined
      }));

      setPlaydates(enrichedPlaydates);
    } catch (e) {
      console.error('Error fetching playdates:', e);
    } finally {
      setLoading(false);
    }
  }, [user, dogs]);

  useEffect(() => {
    fetchPlaydates();
  }, [fetchPlaydates]);

  const createPlaydate = async (
    senderDogId: string,
    receiverDogId: string,
    locationName: string,
    date: string,
    time: string,
    message?: string
  ) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('playdate_requests')
      .insert({
        requester_id: user.id,
        sender_dog_id: senderDogId,
        receiver_dog_id: receiverDogId,
        location_name: locationName,
        requested_date: date,
        requested_time: time,
        request_message: message,
        status: 'pending'
      });

    if (!error) {
      await fetchPlaydates();
    }

    return { error };
  };

  const updatePlaydateStatus = async (playdateId: string, status: 'accepted' | 'declined' | 'completed') => {
    const { error } = await supabase
      .from('playdate_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', playdateId);

    if (!error) {
      await fetchPlaydates();
    }

    return { error };
  };

  const pendingPlaydates = playdates.filter(p => p.status === 'pending');
  const acceptedPlaydates = playdates.filter(p => p.status === 'accepted');
  const completedPlaydates = playdates.filter(p => p.status === 'completed');

  return {
    playdates,
    pendingPlaydates,
    acceptedPlaydates,
    completedPlaydates,
    loading,
    createPlaydate,
    updatePlaydateStatus,
    refresh: fetchPlaydates
  };
}

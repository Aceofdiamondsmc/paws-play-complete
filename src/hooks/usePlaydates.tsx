import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useBlockedUsers } from './useBlockedUsers';
import type { PlaydateRequest, Dog, Profile } from '@/types';

interface PlaydateWithDetails extends PlaydateRequest {
  senderDog?: Dog;
  receiverDog?: Dog;
  requesterProfile?: Profile;
}

export function usePlaydates() {
  const { user, dogs } = useAuth();
  const { blockedUserIds } = useBlockedUsers();
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

      // Fetch profiles from public_profiles view
      const { data: profilesData, error: profilesError } = await supabase
        .from('public_profiles')
        .select('id, display_name, avatar_url, city, state')
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
      })).filter((p: PlaydateWithDetails) => 
        // Filter out playdates from blocked users (defense-in-depth)
        !p.requester_id || !blockedUserIds.has(p.requester_id)
      );

      setPlaydates(enrichedPlaydates);
    } catch (e) {
      console.error('Error fetching playdates:', e);
    } finally {
      setLoading(false);
    }
  }, [user, dogs, blockedUserIds]);

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

  // Accept playdate and create schedule in one transaction-like flow
  const acceptPlaydate = async (playdateId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Find the playdate to get details
    const playdate = playdates.find(p => p.id === playdateId);
    if (!playdate) return { error: new Error('Playdate not found') };

    // Step 1: Update status to accepted
    const { error: updateError } = await supabase
      .from('playdate_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', playdateId);

    if (updateError) return { error: updateError };

    // Step 2: Create schedule entry
    const proposedDate = playdate.requested_date && playdate.requested_time
      ? new Date(`${playdate.requested_date}T${playdate.requested_time}`)
      : new Date();

    const { error: scheduleError } = await supabase
      .from('playdate_schedules')
      .insert({
        playdate_request_id: playdateId,
        proposed_by: user.id,
        proposed_date: proposedDate.toISOString(),
        location_name: playdate.location_name || 'TBD',
        status: 'confirmed'
      });

    if (scheduleError) {
      console.error('Error creating schedule:', scheduleError);
      // Rollback status if schedule fails (best effort)
      await supabase
        .from('playdate_requests')
        .update({ status: 'pending', updated_at: new Date().toISOString() })
        .eq('id', playdateId);
      return { error: scheduleError };
    }

    await fetchPlaydates();
    return { error: null };
  };

  const clearHistory = async () => {
    if (!user || dogs.length === 0) return { error: new Error('Not authenticated') };

    const dogIds = dogs.map(d => d.id);
    const historicalStatuses = ['completed', 'declined', 'cancelled'];

    // Delete where user is requester
    const { error: reqError } = await supabase
      .from('playdate_requests')
      .delete()
      .eq('requester_id', user.id)
      .in('status', historicalStatuses);

    if (reqError) return { error: reqError };

    // Delete where user owns the receiver dog
    const { error: recError } = await supabase
      .from('playdate_requests')
      .delete()
      .in('receiver_dog_id', dogIds)
      .in('status', historicalStatuses);

    if (recError) return { error: recError };

    await fetchPlaydates();
    return { error: null };
  };

  const deletePlaydate = async (playdateId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('playdate_requests')
      .delete()
      .eq('id', playdateId);

    if (!error) {
      await fetchPlaydates();
    }

    return { error };
  };

  const cancelPlaydate = async (playdateId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    // Step 1: Update playdate request status to cancelled
    const { error: requestError } = await supabase
      .from('playdate_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', playdateId);

    if (requestError) return { error: requestError };

    // Step 2: Update associated schedule to cancelled
    await supabase
      .from('playdate_schedules')
      .update({ status: 'cancelled' })
      .eq('playdate_request_id', playdateId);

    await fetchPlaydates();
    return { error: null };
  };

  const pendingPlaydates = playdates.filter(p => p.status === 'pending');
  const acceptedPlaydates = playdates.filter(p => p.status === 'accepted');
  const completedPlaydates = playdates.filter(p => p.status === 'completed');

  // Separate incoming vs outgoing pending requests
  const incomingPendingPlaydates = pendingPlaydates.filter(p => {
    // User is the receiver if they own the receiver dog
    return dogs.some(d => d.id === p.receiver_dog_id);
  });

  const outgoingPendingPlaydates = pendingPlaydates.filter(p => {
    return p.requester_id === user?.id;
  });

  return {
    playdates,
    pendingPlaydates,
    incomingPendingPlaydates,
    outgoingPendingPlaydates,
    acceptedPlaydates,
    completedPlaydates,
    loading,
    createPlaydate,
    updatePlaydateStatus,
    acceptPlaydate,
    cancelPlaydate,
    clearHistory,
    refresh: fetchPlaydates
  };
}

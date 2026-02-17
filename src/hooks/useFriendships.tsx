import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Friendship, Profile } from '@/types';

interface FriendWithProfile extends Friendship {
  friend: Profile;
}

export function useFriendships() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [pendingRequests, setPendingRequests] = useState<FriendWithProfile[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFriendships = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all friendships involving the current user
      const { data: friendships, error } = await supabase
        .from('friendships')
        .select('*')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (error) throw error;

      // Get all unique user IDs we need to fetch profiles for
      const userIds = new Set<string>();
      friendships?.forEach((f: Friendship) => {
        if (f.requester_id !== user.id) userIds.add(f.requester_id);
        if (f.addressee_id !== user.id) userIds.add(f.addressee_id);
      });

      // Fetch profiles for these users (use profiles_safe view for authenticated access)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles_safe')
        .select('id, display_name, full_name, avatar_url, city, state')
        .in('id', Array.from(userIds));

      if (profilesError) {
        console.error('Error fetching profiles (session may have expired):', profilesError);
      }

      const profileMap = new Map<string, Profile>();
      profiles?.forEach((p: Profile) => profileMap.set(p.id, p));

      // Categorize friendships
      const accepted: FriendWithProfile[] = [];
      const pending: FriendWithProfile[] = [];
      const sent: FriendWithProfile[] = [];

      friendships?.forEach((f: Friendship) => {
        const friendId = f.requester_id === user.id ? f.addressee_id : f.requester_id;
        const friend = profileMap.get(friendId);
        if (!friend) return;

        const friendWithProfile: FriendWithProfile = { ...f, friend };

        if (f.status === 'accepted') {
          accepted.push(friendWithProfile);
        } else if (f.status === 'pending') {
          if (f.addressee_id === user.id) {
            pending.push(friendWithProfile);
          } else {
            sent.push(friendWithProfile);
          }
        }
      });

      setFriends(accepted);
      setPendingRequests(pending);
      setSentRequests(sent);
    } catch (e) {
      console.error('Error fetching friendships:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFriendships();
  }, [fetchFriendships]);

  const sendFriendRequest = async (addresseeId: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('friendships')
      .insert({
        requester_id: user.id,
        addressee_id: addresseeId,
        status: 'pending'
      });

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  const acceptRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  const declineRequest = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  const removeFriend = async (friendshipId: string) => {
    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('id', friendshipId);

    if (!error) {
      await fetchFriendships();
    }

    return { error };
  };

  return {
    friends,
    pendingRequests,
    sentRequests,
    loading,
    sendFriendRequest,
    acceptRequest,
    declineRequest,
    removeFriend,
    refresh: fetchFriendships
  };
}

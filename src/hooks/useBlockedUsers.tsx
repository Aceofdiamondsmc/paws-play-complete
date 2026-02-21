import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface BlockedUserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [blockedUsers, setBlockedUsers] = useState<BlockedUserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    const ids = (data || []).map((r: any) => r.blocked_id);
    setBlockedUserIds(new Set(ids));

    // Fetch profiles for blocked users
    if (ids.length > 0) {
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, display_name, avatar_url')
        .in('id', ids);
      setBlockedUsers(
        (profiles || []).map((p: any) => ({
          id: p.id,
          display_name: p.display_name,
          avatar_url: p.avatar_url,
        }))
      );
    } else {
      setBlockedUsers([]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchBlocked();
  }, [fetchBlocked]);

  const blockUser = async (blockedId: string, reason?: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase.rpc('block_user_and_decline_requests', {
      p_blocker: user.id,
      p_blocked: blockedId,
    });
    if (!error) {
      if (reason) {
        await supabase
          .from('user_blocks')
          .update({ reason })
          .eq('blocker_id', user.id)
          .eq('blocked_id', blockedId);
      }
      setBlockedUserIds(prev => new Set([...prev, blockedId]));
      // Refresh to get profile info
      fetchBlocked();
    }
    return { error };
  };

  const unblockUser = async (blockedId: string) => {
    if (!user) return { error: new Error('Not authenticated') };
    const { error } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', blockedId);
    if (!error) {
      setBlockedUserIds(prev => {
        const next = new Set(prev);
        next.delete(blockedId);
        return next;
      });
      setBlockedUsers(prev => prev.filter(u => u.id !== blockedId));
    }
    return { error };
  };

  const isBlocked = (userId: string) => blockedUserIds.has(userId);

  return { blockedUserIds, blockedUsers, isBlocked, blockUser, unblockUser, loading, refresh: fetchBlocked };
}

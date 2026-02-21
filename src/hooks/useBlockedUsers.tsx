import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export function useBlockedUsers() {
  const { user } = useAuth();
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const fetchBlocked = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_blocks')
      .select('blocked_id')
      .eq('blocker_id', user.id);
    setBlockedUserIds(new Set((data || []).map((r: any) => r.blocked_id)));
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
      // If there's a reason, update it
      if (reason) {
        await supabase
          .from('user_blocks')
          .update({ reason })
          .eq('blocker_id', user.id)
          .eq('blocked_id', blockedId);
      }
      setBlockedUserIds(prev => new Set([...prev, blockedId]));
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
    }
    return { error };
  };

  const isBlocked = (userId: string) => blockedUserIds.has(userId);

  return { blockedUserIds, isBlocked, blockUser, unblockUser, loading, refresh: fetchBlocked };
}

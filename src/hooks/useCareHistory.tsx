import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CareHistoryEntry {
  id: string;
  user_id: string;
  reminder_id: string | null;
  completed_at: string;
  status: string;
  category: string;
  task_details: string | null;
  notes: string | null;
}

export function useCareHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<CareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('care_history')
      .select('*')
      .eq('user_id', user.id)
      .order('completed_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error fetching care history:', error);
    } else {
      setHistory(data as CareHistoryEntry[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const logActivity = async (activity: {
    category: string;
    task_details?: string;
    notes?: string;
    reminder_id?: string;
  }) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { data, error } = await supabase
      .from('care_history')
      .insert({
        user_id: user.id,
        category: activity.category,
        task_details: activity.task_details || null,
        notes: activity.notes || null,
        reminder_id: activity.reminder_id || null,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();

    if (!error) {
      await fetchHistory();
    }

    return { data, error };
  };

  return {
    history,
    loading,
    logActivity,
    refetch: fetchHistory,
  };
}

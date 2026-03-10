import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { differenceInDays } from 'date-fns';

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

export type SupplyStatus = 'stocked' | 'low' | 'out' | 'unknown';
export type BagSize = 'large' | 'standard' | 'small';

export interface SupplyStatusInfo {
  status: SupplyStatus;
  daysSince: number | null;
  lastEntry: CareHistoryEntry | null;
}

function computeSupplyStatus(lastEntry: CareHistoryEntry | null, bagSize: BagSize): SupplyStatusInfo {
  if (!lastEntry) {
    return { status: 'unknown', daysSince: null, lastEntry: null };
  }

  // "Out of stock" always maps to 'out'
  if (lastEntry.task_details === 'Out of stock' || lastEntry.notes === 'Out of stock') {
    const daysSince = differenceInDays(new Date(), new Date(lastEntry.completed_at));
    return { status: 'out', daysSince, lastEntry };
  }

  const daysSince = differenceInDays(new Date(), new Date(lastEntry.completed_at));
  const thresholds = bagSize === 'large'
    ? { yellow: 15, red: 26 }
    : bagSize === 'standard'
    ? { yellow: 8, red: 13 }
    : { yellow: 4, red: 6 };

  const status: SupplyStatus =
    daysSince >= thresholds.red ? 'out' :
    daysSince >= thresholds.yellow ? 'low' : 'stocked';

  return { status, daysSince, lastEntry };
}

export function useCareHistory(bagSize: BagSize = 'standard') {
  const { user } = useAuth();
  const [history, setHistory] = useState<CareHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [supplyStatus, setSupplyStatus] = useState<SupplyStatusInfo>({
    status: 'unknown', daysSince: null, lastEntry: null,
  });

  const fetchHistory = useCallback(async () => {
    if (!user) {
      setHistory([]);
      setSupplyStatus({ status: 'unknown', daysSince: null, lastEntry: null });
      setLoading(false);
      return;
    }

    // Fetch history and latest restock in parallel
    const [historyResult, restockResult] = await Promise.all([
      supabase
        .from('care_history')
        .select('*')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5),
      supabase
        .from('care_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('category', 'restock')
        .order('completed_at', { ascending: false })
        .limit(1),
    ]);

    if (historyResult.error) {
      console.error('Error fetching care history:', historyResult.error);
    } else {
      setHistory(historyResult.data as CareHistoryEntry[]);
    }

    const latestRestock = (restockResult.data?.[0] as CareHistoryEntry) || null;
    setSupplyStatus(computeSupplyStatus(latestRestock, bagSize));

    setLoading(false);
  }, [user, bagSize]);

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

  const deleteEntry = async (id: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    const { error } = await supabase
      .from('care_history')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (!error) {
      setHistory((prev) => prev.filter((e) => e.id !== id));
      // Re-fetch to update supply status if a restock entry was deleted
      await fetchHistory();
    }

    return { error };
  };

  return {
    history,
    loading,
    supplyStatus,
    logActivity,
    deleteEntry,
    refetch: fetchHistory,
  };
}

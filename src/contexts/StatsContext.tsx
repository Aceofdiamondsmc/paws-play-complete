import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatsContextValue {
  parkCount: number | null;
  loading: boolean;
  prefetchStats: () => Promise<void>;
}

const StatsContext = createContext<StatsContextValue | undefined>(undefined);

export function StatsProvider({ children }: { children: ReactNode }) {
  const [parkCount, setParkCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  const fetchParkCount = useCallback(async () => {
    if (hasFetched || loading) return;
    
    setLoading(true);
    try {
      // Lightweight query - just gets a single number from the view
      const { data, error } = await supabase
        .from('park_counts')
        .select('total_parks')
        .maybeSingle();

      if (error) {
        console.error('Failed to fetch park count:', error);
        return;
      }

      if (data?.total_parks != null) {
        setParkCount(Number(data.total_parks));
        setHasFetched(true);
      }
    } catch (error) {
      console.error('Error fetching park count:', error);
    } finally {
      setLoading(false);
    }
  }, [hasFetched, loading]);

  // Fetch on mount
  useEffect(() => {
    fetchParkCount();
  }, [fetchParkCount]);

  const prefetchStats = useCallback(async () => {
    if (!hasFetched) {
      await fetchParkCount();
    }
  }, [fetchParkCount, hasFetched]);

  return (
    <StatsContext.Provider value={{ parkCount, loading, prefetchStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  const context = useContext(StatsContext);
  if (context === undefined) {
    throw new Error('useStats must be used within a StatsProvider');
  }
  return context;
}

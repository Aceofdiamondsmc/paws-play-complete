import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface StatsContextType {
  parkCount: number;
  loading: boolean;
}

const StatsContext = createContext<StatsContextType>({ parkCount: 0, loading: true });

export function StatsProvider({ children }: { children: ReactNode }) {
  const [parkCount, setParkCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchParkCount = async () => {
      try {
        const { count, error } = await supabase
          .from('parks')
          .select('*', { count: 'exact', head: true });

        if (error) throw error;
        setParkCount(count || 0);
      } catch (e) {
        console.error('Error fetching park count:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchParkCount();
  }, []);

  return (
    <StatsContext.Provider value={{ parkCount, loading }}>
      {children}
    </StatsContext.Provider>
  );
}

export function useStats() {
  return useContext(StatsContext);
}

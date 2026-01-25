import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";

interface StatsContextType {
  parkCount: number;
}

const StatsContext = createContext<StatsContextType>({ parkCount: 0 });

export const StatsProvider = ({ children }: { children: React.ReactNode }) => {
  const [parkCount, setParkCount] = useState(0);

  useEffect(() => {
    const fetchParkCount = async () => {
      // Fetching only the count to keep it lightweight and fast
      const { count, error } = await supabase
        .from('parks')
        .select('*', { count: 'exact', head: true });
      
      if (!error && count !== null) {
        setParkCount(count);
      }
    };

    fetchParkCount();
  }, []); // Only runs once when the app first loads

  return (
    <StatsContext.Provider value={{ parkCount }}>
      {children}
    </StatsContext.Provider>
  );
};

export const useStats = () => useContext(StatsContext);


import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Park, ParkFilter } from '@/types';

const PARKS_CACHE_KEY = 'paws_parks_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CachedParks {
  parks: Park[];
  timestamp: number;
}

export function useParks() {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);

  // Load from cache first for offline support
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(PARKS_CACHE_KEY);
      if (cached) {
        const { parks: cachedParks, timestamp }: CachedParks = JSON.parse(cached);
        const isValid = Date.now() - timestamp < CACHE_DURATION;
        if (isValid || !navigator.onLine) {
          setParks(cachedParks);
          return true;
        }
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return false;
  }, []);

  // Save to cache
  const saveToCache = useCallback((parks: Park[]) => {
    try {
      const cacheData: CachedParks = {
        parks,
        timestamp: Date.now()
      };
      localStorage.setItem(PARKS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }, []);

  // Fetch parks from Supabase
  const fetchParks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('parks')
        .select('*')
        .eq('is_dog_friendly', true)
        .order('rating', { ascending: false });

      if (fetchError) throw fetchError;

      const parksData = (data || []) as Park[];
      setParks(parksData);
      saveToCache(parksData);
    } catch (e) {
      console.error('Error fetching parks:', e);
      setError('Failed to load parks. Showing cached data.');
      loadFromCache();
    } finally {
      setLoading(false);
    }
  }, [loadFromCache, saveToCache]);

  // Initial load
  useEffect(() => {
    const hasCache = loadFromCache();
    if (hasCache) {
      setLoading(false);
    }
    fetchParks();
  }, [fetchParks, loadFromCache]);

  // Filter parks based on active filters
  const filteredParks = parks.filter(park => {
    if (activeFilters.length === 0) return true;

    return activeFilters.every(filter => {
      switch (filter) {
        case 'fenced':
          return park.is_fenced;
        case 'water':
          return park.has_water_fountain;
        // For other filters, we'll need additional fields in the database
        // For now, show all parks if these filters are selected
        default:
          return true;
      }
    });
  });

  const toggleFilter = (filter: ParkFilter) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  return {
    parks: filteredParks,
    allParks: parks,
    loading,
    error,
    activeFilters,
    toggleFilter,
    clearFilters,
    refresh: fetchParks
  };
}

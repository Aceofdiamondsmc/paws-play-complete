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

      // Map database columns to our Park type
      // Using 'as any' to work around stale generated types - the DB has the correct column names
      const parksData: Park[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        description: row.description,
        latitude: row.latitude,
        longitude: row.longitude,
        image_url: row.image_url,
        rating: row.rating,
        user_ratings_total: row.user_ratings_total,
        is_fully_fenced: row.is_fully_fenced,
        has_water_station: row.has_water_station,
        has_small_dog_area: row.has_small_dog_area,
        has_large_dog_area: row.has_large_dog_area,
        has_agility_equipment: row.has_agility_equipment,
        has_parking: row.has_parking,
        has_grass_surface: row.has_grass_surface,
        is_dog_friendly: row.is_dog_friendly,
        gemini_summary: row.gemini_summary,
        place_id: row.place_id,
        added_by: row.added_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));
      
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
          return park.is_fully_fenced;
        case 'water':
          return park.has_water_station;
        case 'small-dogs':
          return park.has_small_dog_area;
        case 'large-dogs':
          return park.has_large_dog_area;
        case 'agility':
          return park.has_agility_equipment;
        case 'parking':
          return park.has_parking;
        case 'grass':
          return park.has_grass_surface;
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

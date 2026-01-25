import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Park, ParkFilter } from '@/types';

const PARKS_CACHE_KEY = 'paws_parks_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const PAGE_SIZE = 50;

interface CachedParks {
  parks: Park[];
  timestamp: number;
}

export function useParks() {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const initialLoadDone = useRef(false);

  // Build filter conditions for the query
  const buildFilterQuery = useCallback((query: any) => {
    activeFilters.forEach(filter => {
      switch (filter) {
        case 'fenced':
          query = query.eq('is_fully_fenced', true);
          break;
        case 'water':
          query = query.eq('has_water_station', true);
          break;
        case 'small-dogs':
          query = query.eq('has_small_dog_area', true);
          break;
        case 'large-dogs':
          query = query.eq('has_large_dog_area', true);
          break;
        case 'agility':
          query = query.eq('has_agility_equipment', true);
          break;
        case 'parking':
          query = query.eq('has_parking', true);
          break;
        case 'grass':
          query = query.eq('has_grass_surface', true);
          break;
      }
    });
    return query;
  }, [activeFilters]);

  // Map database row to Park type
  const mapRowToPark = (row: any): Park => ({
    id: String(row.Id),
    name: row.name,
    address: row.address,
    city: row.city,
    state: row.state,
    description: row.description,
    latitude: row.latitude,
    longitude: row.longitude,
    geom: row.geom,
    image_url: row.image_url,
    rating: row.rating,
    user_ratings_total: row.user_rating_total,
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
  });

  // Load from cache for offline support
  const loadFromCache = useCallback(() => {
    try {
      const cached = localStorage.getItem(PARKS_CACHE_KEY);
      if (cached) {
        const { parks: cachedParks, timestamp }: CachedParks = JSON.parse(cached);
        const isValid = Date.now() - timestamp < CACHE_DURATION;
        if (isValid || !navigator.onLine) {
          setParks(cachedParks);
          setHasMore(false); // Cache has all previously loaded parks
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

  // Fetch parks with pagination
  const fetchParks = useCallback(async (offset: number = 0, append: boolean = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      let query = supabase
        .from('parks')
        .select('*')
        .order('rating', { ascending: false, nullsFirst: false })
        .range(offset, offset + PAGE_SIZE - 1);

      // Apply filters
      query = buildFilterQuery(query);

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const parksData: Park[] = (data || []).map(mapRowToPark);
      
      // Check if we have more data
      setHasMore(parksData.length === PAGE_SIZE);
      
      if (append) {
        setParks(prev => {
          const newParks = [...prev, ...parksData];
          saveToCache(newParks);
          return newParks;
        });
      } else {
        setParks(parksData);
        saveToCache(parksData);
      }
      
      offsetRef.current = offset + parksData.length;
    } catch (e) {
      console.error('Error fetching parks:', e);
      setError('Failed to load parks. Showing cached data.');
      if (!append) {
        loadFromCache();
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildFilterQuery, loadFromCache, saveToCache]);

  // Load more parks
  const loadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchParks(offsetRef.current, true);
    }
  }, [fetchParks, loadingMore, hasMore]);

  // Reset and refetch when filters change
  useEffect(() => {
    offsetRef.current = 0;
    setHasMore(true);
    fetchParks(0, false);
  }, [activeFilters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial load
  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;
    
    const hasCache = loadFromCache();
    if (hasCache) {
      setLoading(false);
    }
    fetchParks(0, false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Refresh from start
  const refresh = useCallback(() => {
    offsetRef.current = 0;
    setHasMore(true);
    fetchParks(0, false);
  }, [fetchParks]);

  return {
    parks,
    allParks: parks, // Alias for backward compatibility
    loading,
    loadingMore,
    error,
    activeFilters,
    hasMore,
    toggleFilter,
    clearFilters,
    refresh,
    loadMore
  };
}

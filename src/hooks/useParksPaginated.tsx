import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Park, ParkFilter } from '@/types';

const PAGE_SIZE = 20;
const PARKS_CACHE_KEY = 'paws_parks_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CachedParks {
  parks: Park[];
  timestamp: number;
}

export function useParksPaginated() {
  const [parks, setParks] = useState<Park[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Load from cache for immediate display
  const loadFromCache = useCallback((): Park[] => {
    try {
      const cached = localStorage.getItem(PARKS_CACHE_KEY);
      if (cached) {
        const { parks: cachedParks, timestamp }: CachedParks = JSON.parse(cached);
        const isValid = Date.now() - timestamp < CACHE_DURATION;
        if (isValid || !navigator.onLine) {
          return cachedParks;
        }
      }
    } catch (e) {
      console.error('Cache read error:', e);
    }
    return [];
  }, []);

  // Save to cache
  const saveToCache = useCallback((parksToCache: Park[]) => {
    try {
      const cacheData: CachedParks = {
        parks: parksToCache,
        timestamp: Date.now()
      };
      localStorage.setItem(PARKS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }, []);

  // Fetch a specific page
  const fetchPage = useCallback(async (pageNum: number, append = false) => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    const from = (pageNum - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    try {
      const { data, error: fetchError } = await supabase
        .from('parks')
        .select('*')
        .order('rating', { ascending: false, nullsFirst: false })
        .range(from, to)
        .abortSignal(abortControllerRef.current.signal);

      if (fetchError) {
        // Check if it was an abort
        if (fetchError.message?.includes('abort') || fetchError.code === '20') {
          return;
        }
        throw fetchError;
      }

      const mappedData = (data || []).map(mapRowToPark);
      setHasMore((data?.length || 0) === PAGE_SIZE);
      
      setParks(prev => {
        const newParks = append ? [...prev, ...mappedData] : mappedData;
        // Cache all fetched parks when loading initial page
        if (!append && pageNum === 1) {
          saveToCache(newParks);
        }
        return newParks;
      });
      
      setError(null);
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Error fetching parks:', e);
      setError('Failed to load parks');
    }
  }, [saveToCache]);

  // Initial load with cache-first strategy
  useEffect(() => {
    // Show cached data immediately for instant UX
    const cached = loadFromCache();
    if (cached.length > 0) {
      setParks(cached.slice(0, PAGE_SIZE));
      setLoading(false);
      setHasMore(cached.length > PAGE_SIZE);
    }

    // Fetch fresh data in background
    fetchPage(1).finally(() => setLoading(false));

    // Cleanup: cancel on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchPage, loadFromCache]);

  // Load more pages
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    
    fetchPage(nextPage, true).finally(() => {
      setPage(nextPage);
      setLoadingMore(false);
    });
  }, [loadingMore, hasMore, page, fetchPage]);

  // Refresh data
  const refresh = useCallback(async () => {
    setPage(1);
    setLoading(true);
    await fetchPage(1);
    setLoading(false);
  }, [fetchPage]);

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
    loadingMore,
    hasMore,
    error,
    activeFilters,
    toggleFilter,
    clearFilters,
    loadMore,
    refresh
  };
}

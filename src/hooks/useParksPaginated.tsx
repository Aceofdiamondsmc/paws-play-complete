import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { hasValidCoords, calculateDistance } from '@/lib/navigation-utils';
import type { Park, ParkFilter } from '@/types';

const PAGE_SIZE = 20;
const PARKS_CACHE_KEY = 'paws_parks_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CachedParks {
  parks: Park[];
  timestamp: number;
}

interface UserLocation {
  lat: number;
  lng: number;
}

export function useParksPaginated(userLocation?: UserLocation | null) {
  const [parks, setParks] = useState<Park[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasLocationRef = useRef<boolean>(!!userLocation);

  // Track if location changed to trigger re-sort
  useEffect(() => {
    hasLocationRef.current = !!userLocation;
  }, [userLocation]);

  // Map database row to Park type with distance calculation
  const mapRowToPark = useCallback((row: any, location?: UserLocation | null): Park => {
    const park: Park = {
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
    };
    
    // Calculate distance if location available
    if (location && row.latitude && row.longitude) {
      park.distance = calculateDistance(location.lat, location.lng, row.latitude, row.longitude);
    }
    
    return park;
  }, []);

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

  // Fetch all parks and sort by proximity (or rating if no location)
  const fetchParks = useCallback(async (location?: UserLocation | null) => {
    // Cancel any in-flight request
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    try {
      // Fetch all parks
      const { data, error: fetchError } = await supabase
        .from('parks')
        .select('*')
        .abortSignal(abortControllerRef.current.signal);

      if (fetchError) {
        // Check if it was an abort
        if (fetchError.message?.includes('abort') || fetchError.code === '20') {
          return;
        }
        throw fetchError;
      }

      // Map all parks and calculate distances
      let mappedData = (data || []).map(row => mapRowToPark(row, location));
      
      // ALWAYS sort by distance if location available (nearest first)
      // Parks without distance go to end, then sort by rating as tiebreaker
      if (location) {
        mappedData = mappedData.sort((a, b) => {
          // Parks without coordinates go to the very end
          if (a.distance === undefined && b.distance === undefined) {
            // Sort by rating as fallback
            return (b.rating || 0) - (a.rating || 0);
          }
          if (a.distance === undefined) return 1;
          if (b.distance === undefined) return -1;
          
          // Sort by distance ascending (nearest first)
          return a.distance - b.distance;
        });
      } else {
        // No location - sort by rating descending
        mappedData = mappedData.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      }
      
      // Cache all parks
      saveToCache(mappedData);
      
      // Set initial page of parks (20 nearest)
      setParks(mappedData.slice(0, PAGE_SIZE));
      setHasMore(mappedData.length > PAGE_SIZE);
      setError(null);
      
      return mappedData;
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error('Error fetching parks:', e);
      setError('Failed to load parks');
      return [];
    }
  }, [mapRowToPark, saveToCache]);

  // Store all fetched parks for client-side pagination
  const allParksRef = useRef<Park[]>([]);

  // Initial load with cache-first strategy
  useEffect(() => {
    // Show cached data immediately for instant UX
    const cached = loadFromCache();
    if (cached.length > 0) {
      // Re-sort cached data by proximity if location available
      let sortedCache = cached;
      if (userLocation) {
        sortedCache = cached.map(park => ({
          ...park,
          distance: park.latitude && park.longitude 
            ? calculateDistance(userLocation.lat, userLocation.lng, park.latitude, park.longitude)
            : undefined
        })).sort((a, b) => {
          if (!a.distance && !b.distance) return 0;
          if (!a.distance) return 1;
          if (!b.distance) return -1;
          return a.distance - b.distance;
        });
      }
      allParksRef.current = sortedCache;
      setParks(sortedCache.slice(0, PAGE_SIZE));
      setLoading(false);
      setHasMore(sortedCache.length > PAGE_SIZE);
    }

    // Fetch fresh data in background
    fetchParks(userLocation).then(data => {
      if (data) {
        allParksRef.current = data;
      }
    }).finally(() => setLoading(false));

    // Cleanup: cancel on unmount
    return () => {
      abortControllerRef.current?.abort();
    };
  }, [fetchParks, loadFromCache, userLocation]);

  // Load more pages (client-side pagination from already-fetched data)
  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    const start = 0;
    const end = nextPage * PAGE_SIZE;
    
    // Slice from all fetched parks
    const nextParks = allParksRef.current.slice(start, end);
    setParks(nextParks);
    setPage(nextPage);
    setHasMore(end < allParksRef.current.length);
    setLoadingMore(false);
  }, [loadingMore, hasMore, page]);

  // Refresh data
  const refresh = useCallback(async () => {
    setPage(1);
    setLoading(true);
    const data = await fetchParks(userLocation);
    if (data) {
      allParksRef.current = data;
    }
    setLoading(false);
  }, [fetchParks, userLocation]);

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

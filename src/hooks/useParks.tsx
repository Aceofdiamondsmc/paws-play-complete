import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Park, ParkFilter } from '@/types';

const PARKS_CACHE_KEY = 'paws_parks_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

interface CachedParks {
  parks: Park[];
  timestamp: number;
}

interface UseParksOptions {
  userLat?: number;
  userLng?: number;
  radiusMeters?: number;
  pageSize?: number;
}

// Map RPC response to Park type
function mapParksData(data: any[]): Park[] {
  return (data || []).map((row: any) => ({
    id: String(row.id),
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
    distance_meters: row.distance_meters,
  }));
}

export function useParks(options: UseParksOptions = {}) {
  const { userLat, userLng, radiusMeters = 10000, pageSize = 50 } = options;

  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
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

  // Fetch parks using RPC
  const fetchParks = useCallback(async (offset: number = 0, append: boolean = false) => {
    // If no location, try to load from cache
    if (!userLat || !userLng) {
      const hasCache = loadFromCache();
      if (hasCache) {
        setLoading(false);
      }
      return;
    }

    try {
      if (offset === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);

      const { data, error: rpcError } = await (supabase.rpc as any)('get_parks_nearby', {
        user_lat: userLat,
        user_lng: userLng,
        radius_meters: radiusMeters,
        page_size: pageSize,
        page_offset: offset
      });

      if (rpcError) throw rpcError;

      const newParks = mapParksData((data as any[]) || []);

      if (append) {
        setParks(prev => [...prev, ...newParks]);
      } else {
        setParks(newParks);
        // Save first page to cache
        saveToCache(newParks);
      }

      setHasMore(newParks.length === pageSize);

    } catch (e) {
      console.error('Error fetching parks:', e);
      setError('Failed to load parks. Showing cached data.');
      // Fall back to cache on error
      loadFromCache();
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [userLat, userLng, radiusMeters, pageSize, loadFromCache, saveToCache]);

  // Load more parks (pagination)
  const loadMore = useCallback(() => {
    const newOffset = pageOffset + pageSize;
    setPageOffset(newOffset);
    fetchParks(newOffset, true);
  }, [pageOffset, pageSize, fetchParks]);

  // Initial load and refetch when location changes
  useEffect(() => {
    // Load cache immediately for fast initial render
    const hasCache = loadFromCache();
    if (hasCache) {
      setLoading(false);
    }

    // Fetch from RPC when we have location
    if (userLat && userLng) {
      setPageOffset(0);
      // Defer fetch to not block render
      const timeoutId = setTimeout(() => {
        fetchParks(0, false);
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [userLat, userLng, fetchParks, loadFromCache]);

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
    loadMore,
    error,
    activeFilters,
    toggleFilter,
    clearFilters,
    refresh: () => fetchParks(0, false)
  };
}

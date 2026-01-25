import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Park, ParkFilter } from '@/types';

const PARKS_CACHE_KEY = 'paws_parks_cache';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const DEFAULT_LIMIT = 50; // Only fetch 50 nearest parks
const DEFAULT_RADIUS = 50000; // 50km radius

interface CachedParks {
  parks: Park[];
  timestamp: number;
  center?: { lat: number; lng: number };
}

interface UseParksOptions {
  center?: { lat: number; lng: number } | null;
  limit?: number;
  radiusMeters?: number;
}

export function useParks(options: UseParksOptions = {}) {
  const { center, limit = DEFAULT_LIMIT, radiusMeters = DEFAULT_RADIUS } = options;
  
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);
  
  // Track the last fetched center to avoid redundant fetches
  const lastFetchedCenterRef = useRef<{ lat: number; lng: number } | null>(null);
  const fetchInProgressRef = useRef(false);

  // Check if center has moved significantly (more than ~1km)
  const hasCenterMovedSignificantly = useCallback((newCenter: { lat: number; lng: number }) => {
    if (!lastFetchedCenterRef.current) return true;
    
    const latDiff = Math.abs(newCenter.lat - lastFetchedCenterRef.current.lat);
    const lngDiff = Math.abs(newCenter.lng - lastFetchedCenterRef.current.lng);
    
    // Roughly 0.01 degrees ≈ 1km
    return latDiff > 0.01 || lngDiff > 0.01;
  }, []);

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
  const saveToCache = useCallback((parks: Park[], centerCoords?: { lat: number; lng: number }) => {
    try {
      const cacheData: CachedParks = {
        parks,
        timestamp: Date.now(),
        center: centerCoords
      };
      localStorage.setItem(PARKS_CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Cache write error:', e);
    }
  }, []);

  // Fetch nearby parks using RPC
  const fetchNearbyParks = useCallback(async (lat: number, lng: number) => {
    if (fetchInProgressRef.current) return;
    
    // Skip if center hasn't moved significantly
    if (!hasCenterMovedSignificantly({ lat, lng })) {
      return;
    }
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      // Use the get_nearby_parks RPC for efficient spatial query
      // Using 'as any' to work around stale generated types
      const { data, error: fetchError } = await (supabase.rpc as any)('get_nearby_parks', {
        user_lat: lat,
        user_lng: lng,
        radius_meters: radiusMeters
      });

      if (fetchError) throw fetchError;

      // Limit results and map to Park type
      const parksData: Park[] = ((data as any[]) || [])
        .slice(0, limit)
        .map((row: any) => ({
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
          distance: row.distance_meters,
        }));
      
      setParks(parksData);
      saveToCache(parksData, { lat, lng });
      lastFetchedCenterRef.current = { lat, lng };
      
    } catch (e) {
      console.error('Error fetching nearby parks:', e);
      setError('Failed to load parks. Showing cached data.');
      loadFromCache();
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [limit, radiusMeters, hasCenterMovedSignificantly, saveToCache, loadFromCache]);

  // Fallback: fetch all parks (for when no center is provided)
  const fetchAllParks = useCallback(async () => {
    if (fetchInProgressRef.current) return;
    
    try {
      fetchInProgressRef.current = true;
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('parks')
        .select('*')
        .order('rating', { ascending: false, nullsFirst: false })
        .limit(limit);

      if (fetchError) throw fetchError;

      const parksData: Park[] = (data || []).map((row: any) => ({
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
      }));
      
      setParks(parksData);
      saveToCache(parksData);
    } catch (e) {
      console.error('Error fetching parks:', e);
      setError('Failed to load parks. Showing cached data.');
      loadFromCache();
    } finally {
      setLoading(false);
      fetchInProgressRef.current = false;
    }
  }, [limit, loadFromCache, saveToCache]);

  // Initial load - try cache first
  useEffect(() => {
    const hasCache = loadFromCache();
    if (hasCache) {
      setLoading(false);
    }
  }, [loadFromCache]);

  // Fetch parks based on center
  useEffect(() => {
    if (center?.lat && center?.lng) {
      fetchNearbyParks(center.lat, center.lng);
    } else if (!center && parks.length === 0) {
      // Only fetch all if no center provided and no parks loaded yet
      fetchAllParks();
    }
  }, [center?.lat, center?.lng, fetchNearbyParks, fetchAllParks, parks.length]);

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

  const refresh = useCallback(() => {
    lastFetchedCenterRef.current = null; // Reset to force refetch
    if (center?.lat && center?.lng) {
      fetchNearbyParks(center.lat, center.lng);
    } else {
      fetchAllParks();
    }
  }, [center, fetchNearbyParks, fetchAllParks]);

  return {
    parks: filteredParks,
    allParks: parks,
    loading,
    error,
    activeFilters,
    toggleFilter,
    clearFilters,
    refresh,
    fetchNearbyParks
  };
}

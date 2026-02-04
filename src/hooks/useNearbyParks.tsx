import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, hasValidCoords, getValidCoords } from '@/lib/navigation-utils';
import type { Park, ParkFilter } from '@/types';

const INITIAL_LIMIT = 15;

interface UserLocation {
  lat: number;
  lng: number;
}

interface UseNearbyParksReturn {
  parks: Park[];
  loading: boolean;
  locationLoading: boolean;
  locationError: string | null;
  userLocation: UserLocation | null;
  activeFilters: ParkFilter[];
  toggleFilter: (filter: ParkFilter) => void;
  clearFilters: () => void;
  searchNearMe: () => void;
  showMore: () => void;
  hasMore: boolean;
  totalMatching: number;
}

/**
 * Simple hook for "Google Search"-like park discovery
 * - Immediate geolocation on mount
 * - Strict distance-based sorting
 * - Fast initial load (15 parks)
 * - Filter support with re-sorting
 */
export function useNearbyParks(): UseNearbyParksReturn {
  const [allParks, setAllParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [activeFilters, setActiveFilters] = useState<ParkFilter[]>([]);
  const [displayLimit, setDisplayLimit] = useState(INITIAL_LIMIT);

  // Fetch all parks once on mount
  useEffect(() => {
    const fetchParks = async () => {
      try {
        const { data, error } = await supabase
          .from('parks')
          .select('*');

        if (error) throw error;

        // Map database rows to Park type (without distance - calculated later)
        const mappedParks: Park[] = (data || []).map(row => ({
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

        setAllParks(mappedParks);
      } catch (e) {
        console.error('Error fetching parks:', e);
      } finally {
        setLoading(false);
      }
    };

    fetchParks();
  }, []);

  // Get user location immediately on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation not supported');
      setLocationLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationError(error.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000, // Cache for 1 minute
      }
    );
  }, []);

  // Manual search trigger
  const searchNearMe = useCallback(() => {
    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationLoading(false);
        setDisplayLimit(INITIAL_LIMIT); // Reset to show fresh results
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0, // Force fresh location
      }
    );
  }, []);

  // Calculate distances and sort - STRICT proximity sorting
  const sortedFilteredParks = useMemo(() => {
    // Step 1: Filter by active filters
    let filtered = allParks.filter(park => {
      if (activeFilters.length === 0) return true;
      return activeFilters.every(filter => {
        switch (filter) {
          case 'fenced': return park.is_fully_fenced;
          case 'water': return park.has_water_station;
          case 'small-dogs': return park.has_small_dog_area;
          case 'large-dogs': return park.has_large_dog_area;
          case 'agility': return park.has_agility_equipment;
          case 'parking': return park.has_parking;
          case 'grass': return park.has_grass_surface;
          default: return true;
        }
      });
    });

    // Step 2: Check coords INDEPENDENTLY, calculate distance only when userLocation available
    const withDistance = filtered.map(park => {
      const coords = getValidCoords(park.latitude, park.longitude);
      const hasCoords = coords !== null;
      
      let distance: number | undefined = undefined;
      if (coords && userLocation) {
        distance = calculateDistance(
          userLocation.lat,
          userLocation.lng,
          coords.lat,
          coords.lng
        );
      }

      return { park, distance, hasValidCoords: hasCoords };
    });

    // Step 3: Sort with proper priority
    withDistance.sort((a, b) => {
      // Both have invalid coords -> sort by rating
      if (!a.hasValidCoords && !b.hasValidCoords) {
        return (b.park.rating || 0) - (a.park.rating || 0);
      }
      // Invalid coords go to bottom
      if (!a.hasValidCoords) return 1;
      if (!b.hasValidCoords) return -1;

      // Both have valid coords
      if (a.distance !== undefined && b.distance !== undefined) {
        // Both have distances -> sort strictly by distance
        return a.distance - b.distance;
      }
      // If no userLocation yet, sort valid-coord parks by rating
      return (b.park.rating || 0) - (a.park.rating || 0);
    });

    // Return parks with distance attached
    return withDistance.map(({ park, distance }) => ({
      ...park,
      distance,
    }));
  }, [allParks, activeFilters, userLocation]);

  // Paginated results
  const displayedParks = useMemo(() => {
    return sortedFilteredParks.slice(0, displayLimit);
  }, [sortedFilteredParks, displayLimit]);

  const toggleFilter = useCallback((filter: ParkFilter) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
    setDisplayLimit(INITIAL_LIMIT); // Reset pagination on filter change
  }, []);

  const clearFilters = useCallback(() => {
    setActiveFilters([]);
    setDisplayLimit(INITIAL_LIMIT);
  }, []);

  const showMore = useCallback(() => {
    setDisplayLimit(prev => prev + INITIAL_LIMIT);
  }, []);

  return {
    parks: displayedParks,
    loading,
    locationLoading,
    locationError,
    userLocation,
    activeFilters,
    toggleFilter,
    clearFilters,
    searchNearMe,
    showMore,
    hasMore: displayLimit < sortedFilteredParks.length,
    totalMatching: sortedFilteredParks.length,
  };
}

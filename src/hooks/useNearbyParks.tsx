import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { calculateDistance, hasValidCoords, getValidCoords } from '@/lib/navigation-utils';
import type { Park, ParkFilter } from '@/types';

const INITIAL_LIMIT = 15;
const MAX_LOCAL_DISTANCE = 80467; // 50 miles in meters

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
  tier1Count: number;
  tier2Count: number;
  tier3Count: number;
  dataReady: boolean;
}

export function useNearbyParks(): UseNearbyParksReturn {
  const [allParks, setAllParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);
  const [locationLoading, setLocationLoading] = useState(true);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [userCity, setUserCity] = useState<string>('');
  const [userState, setUserState] = useState<string>('');
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
        maximumAge: 60000,
      }
    );
  }, []);

  // Reverse geocode to get user's city/state
  useEffect(() => {
    if (!userLocation) return;

    fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${userLocation.lat}&lon=${userLocation.lng}&format=json`,
      { headers: { 'Accept': 'application/json' } }
    )
      .then(r => r.json())
      .then(data => {
        setUserCity(data.address?.city || data.address?.town || data.address?.village || '');
        setUserState(data.address?.state || '');
      })
      .catch(() => { /* silent fail */ });
  }, [userLocation]);

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
        setDisplayLimit(INITIAL_LIMIT);
      },
      (error) => {
        setLocationError(error.message);
        setLocationLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  // Data ready flag: both parks fetched AND location acquired
  const dataReady = allParks.length > 0 && userLocation !== null;

  // 3-Tier sort
  const { tier1Parks, tier2Parks, tier3Parks } = useMemo(() => {
    if (!dataReady) return { tier1Parks: [], tier2Parks: [], tier3Parks: [] };

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

    // Step 2: Categorize into tiers
    const t1: { park: Park; distance: number }[] = [];
    const t2: { park: Park; distance?: number }[] = [];
    const t3: { park: Park; distance?: number }[] = [];

    for (const park of filtered) {
      const coords = getValidCoords(park.latitude, park.longitude);
      let distance: number | undefined;
      let tier = 3;

      if (coords && userLocation) {
        distance = calculateDistance(
          userLocation.lat, userLocation.lng,
          coords.lat, coords.lng
        );
        if (distance <= MAX_LOCAL_DISTANCE) {
          tier = 1;
        }
      }

      // City/state matching for parks not in tier 1
      if (tier === 3 && (userCity || userState)) {
        const cityMatch = userCity && park.city?.toLowerCase() === userCity.toLowerCase();
        const stateMatch = userState && park.state?.toLowerCase() === userState.toLowerCase();
        if (cityMatch || stateMatch) tier = 2;
      }

      if (tier === 1) {
        t1.push({ park, distance: distance! });
      } else if (tier === 2) {
        t2.push({ park, distance });
      } else {
        t3.push({ park, distance });
      }
    }

    // Sort each tier
    t1.sort((a, b) => a.distance - b.distance);
    t2.sort((a, b) => (b.park.rating || 0) - (a.park.rating || 0));
    t3.sort((a, b) => (a.distance !== undefined && b.distance !== undefined)
      ? a.distance - b.distance
      : (b.park.rating || 0) - (a.park.rating || 0)
    );

    return {
      tier1Parks: t1.map(({ park, distance }) => ({ ...park, distance })),
      tier2Parks: t2.map(({ park, distance }) => ({ ...park, distance })),
      tier3Parks: t3.map(({ park, distance }) => ({ ...park, distance })),
    };
  }, [allParks, activeFilters, userLocation, userCity, userState, dataReady]);

  // Tiers 1 and 2 always fully shown; displayLimit only applies to tier 3
  const displayedParks = useMemo(() => {
    return [
      ...tier1Parks,
      ...tier2Parks,
      ...tier3Parks.slice(0, displayLimit),
    ];
  }, [tier1Parks, tier2Parks, tier3Parks, displayLimit]);

  const toggleFilter = useCallback((filter: ParkFilter) => {
    setActiveFilters(prev =>
      prev.includes(filter)
        ? prev.filter(f => f !== filter)
        : [...prev, filter]
    );
    setDisplayLimit(INITIAL_LIMIT);
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
    hasMore: displayLimit < tier3Parks.length,
    totalMatching: tier1Parks.length + tier2Parks.length + tier3Parks.length,
    tier1Count: tier1Parks.length,
    tier2Count: tier2Parks.length,
    tier3Count: tier3Parks.length,
    dataReady,
  };
}

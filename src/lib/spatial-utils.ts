/**
 * Spatial utilities for PostGIS queries
 * Uses the geom column for accurate distance calculations
 */

import { supabase } from '@/integrations/supabase/client';
import type { Park } from '@/types';

/**
 * Fetch parks within a given radius of a point using PostGIS ST_DWithin
 * @param latitude - User's latitude
 * @param longitude - User's longitude  
 * @param radiusMeters - Search radius in meters (default 10km)
 * @returns Parks sorted by distance
 */
export async function fetchNearbyParks(
  latitude: number,
  longitude: number,
  radiusMeters: number = 10000
): Promise<{ parks: Park[]; error: string | null }> {
  try {
    // Use PostGIS function to find parks within radius
    // ST_DWithin checks if geometries are within specified distance
    // ST_Distance calculates actual distance for sorting
    // Using 'as any' to work around stale generated types - the DB function exists
    const { data, error } = await (supabase.rpc as any)('get_nearby_parks', {
      user_lat: latitude,
      user_lng: longitude,
      radius_meters: radiusMeters
    });

    if (error) {
      console.error('Error fetching nearby parks:', error);
      return { parks: [], error: error.message };
    }

    // Map the response to Park type with distance
    const parks: Park[] = ((data as any[]) || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      address: row.address,
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
      distance: row.distance_meters, // Distance from user in meters
    }));

    return { parks, error: null };
  } catch (e) {
    console.error('Spatial query error:', e);
    return { parks: [], error: 'Failed to fetch nearby parks' };
  }
}

/**
 * Format distance for display
 * @param meters - Distance in meters
 * @returns Human-readable distance string
 */
export function formatDistance(meters: number | undefined): string {
  if (!meters) return '';
  
  if (meters < 1000) {
    return `${Math.round(meters)}m away`;
  }
  
  const km = meters / 1000;
  if (km < 10) {
    return `${km.toFixed(1)}km away`;
  }
  
  return `${Math.round(km)}km away`;
}

/**
 * Get user's current location
 * @returns Promise with coordinates or null
 */
export function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => {
        resolve(null);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

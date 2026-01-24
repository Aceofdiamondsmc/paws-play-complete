import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PawPrint, Navigation, Loader2 } from 'lucide-react';
import type { Park } from '@/types';
import { getCurrentLocation } from '@/lib/spatial-utils';

interface ParksMapProps {
  parks: Park[];
  loading: boolean;
  onParkSelect?: (park: Park) => void;
}

export function ParksMap({ parks, loading, onParkSelect }: ParksMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [geocodedParks, setGeocodedParks] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const geocodingInProgress = useRef(new Set<string>());

  // Helper to check if coordinates are valid
  const hasValidCoords = (park: Park) => {
    const lat = park.latitude;
    const lng = park.longitude;
    return (
      lat != null && lng != null &&
      !isNaN(lat) && !isNaN(lng) &&
      isFinite(lat) && isFinite(lng) &&
      lat >= -90 && lat <= 90 &&
      lng >= -180 && lng <= 180
    );
  };

  // Get display coordinates (from park or geocoded cache)
  const getCoords = (park: Park): { lat: number; lng: number } | null => {
    if (hasValidCoords(park)) {
      return { lat: park.latitude!, lng: park.longitude! };
    }
    return geocodedParks.get(park.id) || null;
  };

  // Parks with valid coords OR that have been geocoded
  const validParks = parks.filter(park => getCoords(park) !== null);

  // Fetch Mapbox token and initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const initMap = async () => {
      try {
        // Fetch token from edge function
        const response = await fetch(
          'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/mapbox-token',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch Mapbox token');
        }

        const data = await response.json();
        if (!data.token) {
          throw new Error('Mapbox token not available');
        }

        mapboxgl.accessToken = data.token;

        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [-98.5795, 39.8283], // US center
          zoom: 3,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        map.on('load', () => {
          mapRef.current = map;
          setMapLoaded(true);
        });

        map.on('error', (e) => {
          console.error('Mapbox error:', e);
          setMapError('Failed to load map');
        });

      } catch (error) {
        console.error('Error initializing map:', error);
        setMapError(error instanceof Error ? error.message : 'Failed to initialize map');
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Geocode parks with missing coordinates but valid addresses
  useEffect(() => {
    if (!mapLoaded || !mapboxgl.accessToken) return;

    const parksToGeocode = parks.filter(park => 
      !hasValidCoords(park) && 
      park.address && 
      !geocodedParks.has(park.id) &&
      !geocodingInProgress.current.has(park.id)
    );

    if (parksToGeocode.length === 0) return;

    // Geocode in batches to avoid rate limiting
    const geocodeBatch = async () => {
      for (const park of parksToGeocode.slice(0, 10)) {
        if (geocodingInProgress.current.has(park.id)) continue;
        geocodingInProgress.current.add(park.id);

        try {
          const query = encodeURIComponent(park.address!);
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}&limit=1`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              setGeocodedParks(prev => new Map(prev).set(park.id, { lat, lng }));
            }
          }
        } catch (error) {
          console.warn(`Failed to geocode ${park.name}:`, error);
        } finally {
          geocodingInProgress.current.delete(park.id);
        }
      }
    };

    geocodeBatch();
  }, [parks, mapLoaded, geocodedParks]);

  // Add markers when parks change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    if (validParks.length === 0) return;

    const bounds = new mapboxgl.LngLatBounds();

    validParks.forEach(park => {
      const coords = getCoords(park);
      if (!coords) return;
      
      const { lng, lat } = coords;

      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'park-marker';
      el.innerHTML = `
        <div style="
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, hsl(142, 76%, 36%), hsl(142, 76%, 46%));
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s;
        ">
          <span style="font-size: 14px;">🐕</span>
        </div>
      `;
      el.style.cursor = 'pointer';
      el.addEventListener('mouseenter', () => {
        el.querySelector('div')!.style.transform = 'scale(1.2)';
      });
      el.addEventListener('mouseleave', () => {
        el.querySelector('div')!.style.transform = 'scale(1)';
      });

      // Build popup content with HTML description and navigate button
      const navigateUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      const descriptionHtml = park.description 
        ? `<div style="margin: 8px 0; font-size: 13px; color: #444; max-height: 100px; overflow-y: auto;">${park.description}</div>`
        : '';

      const popupContent = `
        <div style="padding: 12px; max-width: 300px; font-family: system-ui, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-weight: 700; font-size: 16px; color: #1a1a1a;">
            🐕 ${park.name || 'Dog Park'}
          </h3>
          ${park.address ? `<p style="margin: 0 0 6px 0; color: #666; font-size: 13px;">📍 ${park.address}</p>` : ''}
          ${park.rating ? `<p style="margin: 0 0 6px 0; font-size: 13px;">⭐ ${park.rating.toFixed(1)} (${park.user_ratings_total || 0} reviews)</p>` : ''}
          ${descriptionHtml}
          <div style="display: flex; flex-wrap: wrap; gap: 4px; margin: 10px 0;">
            ${park.is_fully_fenced ? '<span style="background: #dcfce7; color: #166534; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">🏠 Fenced</span>' : ''}
            ${park.has_water_station ? '<span style="background: #dbeafe; color: #1e40af; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">💧 Water</span>' : ''}
            ${park.has_small_dog_area ? '<span style="background: #f3e8ff; color: #7e22ce; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">🐩 Small Dogs</span>' : ''}
            ${park.has_large_dog_area ? '<span style="background: #fef3c7; color: #b45309; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">🐕‍🦺 Large Dogs</span>' : ''}
            ${park.has_agility_equipment ? '<span style="background: #fce7f3; color: #be185d; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">🏃 Agility</span>' : ''}
            ${park.has_parking ? '<span style="background: #e5e7eb; color: #374151; padding: 3px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">🚗 Parking</span>' : ''}
          </div>
          <a 
            href="${navigateUrl}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="
              display: inline-flex;
              align-items: center;
              gap: 6px;
              background: linear-gradient(135deg, #3b82f6, #2563eb);
              color: white;
              padding: 8px 16px;
              border-radius: 8px;
              text-decoration: none;
              font-size: 13px;
              font-weight: 600;
              margin-top: 8px;
              box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
            "
          >
            🧭 Navigate
          </a>
        </div>
      `;

      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '320px'
      }).setHTML(popupContent);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      // Call onParkSelect when popup opens
      marker.getElement().addEventListener('click', () => {
        if (onParkSelect) {
          onParkSelect(park);
        }
      });

      markersRef.current.push(marker);
      bounds.extend([lng, lat]);
    });

    // Fit map to show all markers
    if (validParks.length > 1) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    } else if (validParks.length === 1) {
      const coords = getCoords(validParks[0]);
      if (coords) {
        mapRef.current.flyTo({
          center: [coords.lng, coords.lat],
          zoom: 14
        });
      }
    }
  }, [validParks, mapLoaded, onParkSelect]);

  // Handle locate user
  const handleLocateUser = useCallback(async () => {
    if (!mapRef.current) return;
    
    setLocatingUser(true);
    try {
      const position = await getCurrentLocation();
      if (!position) {
        console.error('Could not get user location');
        return;
      }

      const { latitude, longitude } = position;

      // Remove existing user marker
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      // Create user location marker
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width: 20px;
          height: 20px;
          background: #3b82f6;
          border-radius: 50%;
          border: 3px solid white;
          box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2), 0 2px 8px rgba(0,0,0,0.3);
        "></div>
      `;

      userMarkerRef.current = new mapboxgl.Marker({ element: el })
        .setLngLat([longitude, latitude])
        .addTo(mapRef.current);

      mapRef.current.flyTo({
        center: [longitude, latitude],
        zoom: 13,
        duration: 1500
      });

    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setLocatingUser(false);
    }
  }, []);

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapContainerRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {(loading || !mapLoaded) && !mapError && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">
              {!mapLoaded ? 'Loading map...' : 'Loading parks...'}
            </span>
          </div>
        </div>
      )}

      {/* Error state */}
      {mapError && (
        <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3 text-center p-6">
            <PawPrint className="w-12 h-12 text-muted-foreground" />
            <p className="text-muted-foreground">{mapError}</p>
            <Button variant="outline" onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Park count badge */}
      {!loading && mapLoaded && !mapError && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="bg-card/95 backdrop-blur shadow-md px-3 py-1.5">
            <PawPrint className="w-4 h-4 mr-1" />
            {validParks.length} Parks
          </Badge>
        </div>
      )}

      {/* Locate me button */}
      {mapLoaded && !mapError && (
        <div className="absolute bottom-24 right-4 z-10">
          <Button
            size="icon"
            variant="secondary"
            className="bg-card/95 backdrop-blur shadow-md h-10 w-10 rounded-full"
            onClick={handleLocateUser}
            disabled={locatingUser}
            title="Locate Me"
          >
            {locatingUser ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Navigation className="w-5 h-5" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

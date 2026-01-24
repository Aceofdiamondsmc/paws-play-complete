import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PawPrint, Navigation, Loader2, Crosshair, LogIn } from 'lucide-react';
import type { Park } from '@/types';
import { getCurrentLocation } from '@/lib/spatial-utils';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface ParksMapProps {
  parks: Park[];
  loading: boolean;
  onParkSelect?: (park: Park) => void;
}

// Default fallback location (Las Vegas)
const DEFAULT_CENTER: [number, number] = [-115.1398, 36.1699];
const DEFAULT_ZOOM = 12;

// Proximity alert distance in feet (500 feet = ~152.4 meters)
const PROXIMITY_ALERT_FEET = 500;
const FEET_TO_METERS = 0.3048;
const PROXIMITY_ALERT_METERS = PROXIMITY_ALERT_FEET * FEET_TO_METERS;

// Calculate distance between two points using Haversine formula (returns meters)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Request notification permission
async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

// Trigger browser notification
function sendNotification(parkName: string) {
  if (Notification.permission === 'granted') {
    new Notification('🐕 Park Nearby!', {
      body: `You are near ${parkName}!`,
      icon: '/favicon.png',
      tag: 'park-proximity',
      requireInteraction: false
    });
  }
}

// Trigger vibration pattern
function triggerVibration() {
  if ('vibrate' in navigator) {
    // Pulse pattern: vibrate 200ms, pause 100ms, vibrate 200ms
    navigator.vibrate([200, 100, 200]);
  }
}

// Login prompt component for unauthenticated users
function LoginPrompt() {
  const navigate = useNavigate();
  
  return (
    <div className="absolute inset-0 bg-background flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-4 text-center p-6 max-w-sm">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <PawPrint className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Sign in to view parks</h3>
        <p className="text-sm text-muted-foreground">
          Create a free account to explore dog parks near you and track your favorite spots.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
          <Button onClick={() => navigate('/me')}>
            <LogIn className="w-4 h-4 mr-2" />
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ParksMap({ parks, loading, onParkSelect }: ParksMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);
  const [followMe, setFollowMe] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [geocodedParks, setGeocodedParks] = useState<Map<string, { lat: number; lng: number }>>(new Map());
  const geocodingInProgress = useRef(new Set<string>());
  const hasRequestedLocation = useRef(false);
  // Track which parks have already triggered alerts this session
  const alertedParksRef = useRef(new Set<string>());

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

  // Update user marker position
  const updateUserMarker = useCallback((lat: number, lng: number) => {
    if (!mapRef.current) return;

    if (!userMarkerRef.current) {
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
        .setLngLat([lng, lat])
        .addTo(mapRef.current);
    } else {
      userMarkerRef.current.setLngLat([lng, lat]);
    }

    setUserLocation({ lat, lng });
  }, []);

  // Fetch Mapbox token and initialize map
  useEffect(() => {
    if (mapRef.current) return;

    const initMap = async () => {
      try {
        // Get current session for auth header
        const { data: sessionData } = await supabase.auth.getSession();
        const accessToken = sessionData?.session?.access_token;

        if (!accessToken) {
          setNeedsLogin(true);
          setMapError('Please log in to view the map');
          return;
        }

        // Fetch token from edge function with auth
        const response = await fetch(
          'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/mapbox-token',
          {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`
            }
          }
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch Mapbox token');
        }

        const data = await response.json();
        if (!data.token) {
          throw new Error('Mapbox token not available');
        }

        mapboxgl.accessToken = data.token;

        if (!mapContainerRef.current) return;

        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/paws-play-repeat/cmkd8den2000201slhb1k29ty',
          center: DEFAULT_CENTER,
          zoom: DEFAULT_ZOOM,
          attributionControl: true,
        });

        map.addControl(new mapboxgl.NavigationControl(), 'top-right');

        // Disable follow mode when user drags the map
        map.on('dragstart', () => {
          if (followMe) {
            setFollowMe(false);
          }
        });

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
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // Auto-request user location on map load
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || hasRequestedLocation.current) return;
    hasRequestedLocation.current = true;

    const requestLocation = async () => {
      try {
        const position = await getCurrentLocation();
        if (position) {
          updateUserMarker(position.latitude, position.longitude);
          mapRef.current?.flyTo({
            center: [position.longitude, position.latitude],
            zoom: DEFAULT_ZOOM,
            duration: 1500
          });
        }
      } catch (error) {
        console.log('Location access denied, using default location');
        // Already using default center (Las Vegas)
      }
    };

    requestLocation();
  }, [mapLoaded, updateUserMarker]);

  // Check proximity to parks and trigger alerts
  const checkParkProximity = useCallback((userLat: number, userLng: number) => {
    validParks.forEach(park => {
      // Skip if already alerted for this park
      if (alertedParksRef.current.has(park.id)) return;

      const coords = getCoords(park);
      if (!coords) return;

      const distance = calculateDistance(userLat, userLng, coords.lat, coords.lng);
      
      if (distance <= PROXIMITY_ALERT_METERS) {
        // Mark as alerted so we don't trigger again this session
        alertedParksRef.current.add(park.id);

        const parkName = park.name || 'Dog Park';

        // Show toast notification
        toast({
          title: "🐕 Park Nearby!",
          description: `You are near ${parkName}!`,
          duration: 5000,
        });

        // Trigger browser notification
        sendNotification(parkName);

        // Trigger vibration
        triggerVibration();

        console.log(`Proximity alert: ${parkName} (${Math.round(distance)}m away)`);
      }
    });
  }, [validParks]);

  // Handle Follow Me toggle with watchPosition
  useEffect(() => {
    if (!followMe || !mapRef.current) {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      return;
    }

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      setFollowMe(false);
      return;
    }

    // Request notification permission when Follow Me is enabled
    requestNotificationPermission();

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        updateUserMarker(latitude, longitude);
        
        // Check proximity to parks
        checkParkProximity(latitude, longitude);
        
        if (followMe && mapRef.current) {
          mapRef.current.easeTo({
            center: [longitude, latitude],
            duration: 500
          });
        }
      },
      (error) => {
        console.error('Watch position error:', error);
        setFollowMe(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [followMe, updateUserMarker, checkParkProximity]);

  // Geocode parks with missing coordinates and save to database
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
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${mapboxgl.accessToken}&limit=1&country=US`
          );
          
          if (response.ok) {
            const data = await response.json();
            if (data.features && data.features.length > 0) {
              const [lng, lat] = data.features[0].center;
              setGeocodedParks(prev => new Map(prev).set(park.id, { lat, lng }));

              // Save geocoded coordinates back to Supabase
              const { error } = await supabase
                .from('parks')
                .update({ 
                  latitude: lat, 
                  longitude: lng 
                })
                .eq('Id', parseInt(park.id));

              if (error) {
                console.warn(`Failed to save coords for ${park.name}:`, error);
              } else {
                console.log(`Saved geocoded coords for ${park.name}`);
              }
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

    // Only fit bounds if we have valid parks AND user hasn't been located
    if (validParks.length > 1 && !userLocation) {
      mapRef.current.fitBounds(bounds, { padding: 60, maxZoom: 14 });
    } else if (validParks.length === 1 && !userLocation) {
      const coords = getCoords(validParks[0]);
      if (coords) {
        mapRef.current.flyTo({
          center: [coords.lng, coords.lat],
          zoom: 14
        });
      }
    }
  }, [validParks, mapLoaded, onParkSelect, userLocation]);

  // Handle locate user (one-time location)
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
      updateUserMarker(latitude, longitude);

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
  }, [updateUserMarker]);

  // Toggle follow me mode
  const handleToggleFollowMe = useCallback(() => {
    setFollowMe(prev => !prev);
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

      {/* Login required state */}
      {needsLogin && (
        <LoginPrompt />
      )}

      {/* Error state (non-login errors) */}
      {mapError && !needsLogin && (
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

      {/* Location control buttons */}
      {mapLoaded && !mapError && (
        <div className="absolute bottom-24 right-4 z-10 flex flex-col gap-2">
          {/* Follow Me toggle */}
          <Button
            size="icon"
            variant="secondary"
            className={cn(
              "backdrop-blur shadow-md h-10 w-10 rounded-full transition-colors",
              followMe 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-card/95"
            )}
            onClick={handleToggleFollowMe}
            title={followMe ? "Stop following" : "Follow my location"}
          >
            <Crosshair className="w-5 h-5" />
          </Button>

          {/* Locate me button */}
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

import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PawPrint, Navigation, Loader2 } from 'lucide-react';
import type { Park } from '@/types';
import { getCurrentLocation, formatDistance } from '@/lib/spatial-utils';

interface ParksMapProps {
  parks: Park[];
  loading: boolean;
  onParkSelect?: (park: Park) => void;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function ParksMap({ parks, loading, onParkSelect }: ParksMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locatingUser, setLocatingUser] = useState(false);

  // Load Google Maps script via edge function API key
  useEffect(() => {
    if (window.google?.maps) {
      setMapLoaded(true);
      return;
    }

    // Fetch API key from edge function, then load the script
    const loadGoogleMaps = async () => {
      try {
        // Use a public API key or fetch from edge function
        // For now, use a direct key approach - the API key should be configured in Supabase
        const response = await fetch(
          'https://xasbgkggwnkvrceziaix.supabase.co/functions/v1/google-places',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'getApiKey' })
          }
        );
        
        if (!response.ok) {
          // Fallback: try to load without fetching key (may already be in window)
          console.warn('Could not fetch API key, checking if maps already loaded');
          if (window.google?.maps) {
            setMapLoaded(true);
          }
          return;
        }
        
        const data = await response.json();
        const apiKey = data.apiKey;
        
        if (!apiKey) {
          console.error('Google Maps API key not available');
          return;
        }

        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = () => setMapLoaded(true);
        script.onerror = () => console.error('Failed to load Google Maps');
        document.head.appendChild(script);
      } catch (error) {
        console.error('Error loading Google Maps:', error);
      }
    };

    loadGoogleMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    // Default center (US center)
    const defaultCenter = { lat: 39.8283, lng: -98.5795 };
    
    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
      center: defaultCenter,
      zoom: 4,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
      styles: [
        {
          featureType: 'poi.park',
          elementType: 'geometry.fill',
          stylers: [{ color: '#c8e6c9' }]
        },
        {
          featureType: 'poi.park',
          elementType: 'labels.text.fill',
          stylers: [{ color: '#2e7d32' }]
        }
      ]
    });

    infoWindowRef.current = new window.google.maps.InfoWindow();
  }, [mapLoaded]);

  // Add/update markers when parks change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Filter parks with valid coordinates (excluding null and NaN)
    const validParks = parks.filter(park => 
      park.latitude != null && park.longitude != null &&
      !isNaN(park.latitude) && !isNaN(park.longitude) &&
      isFinite(park.latitude) && isFinite(park.longitude)
    );

    if (validParks.length === 0) return;

    // Create bounds to fit all markers
    const bounds = new window.google.maps.LatLngBounds();

    validParks.forEach(park => {
      const position = { lat: park.latitude!, lng: park.longitude! };
      
      // Custom marker icon
      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        title: park.name,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#10b981',
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
        animation: window.google.maps.Animation.DROP,
      });

      // Click handler for info window
      marker.addListener('click', () => {
        const distanceText = park.distance ? formatDistance(park.distance) : '';
        const content = `
          <div style="padding: 8px; max-width: 280px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; font-size: 16px; color: #1a1a1a;">
              🐕 ${park.name}
            </h3>
            ${park.address ? `<p style="margin: 0 0 6px 0; color: #666; font-size: 13px;">${park.address}</p>` : ''}
            ${park.rating ? `<p style="margin: 0 0 6px 0; font-size: 13px;">⭐ ${park.rating.toFixed(1)} (${park.user_ratings_total || 0} reviews)</p>` : ''}
            ${distanceText ? `<p style="margin: 0 0 6px 0; color: #10b981; font-size: 13px;">📍 ${distanceText}</p>` : ''}
            <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px;">
              ${park.is_fully_fenced ? '<span style="background: #dcfce7; color: #166534; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🏠 Fenced</span>' : ''}
              ${park.has_water_station ? '<span style="background: #dbeafe; color: #1e40af; padding: 2px 8px; border-radius: 12px; font-size: 11px;">💧 Water</span>' : ''}
              ${park.has_small_dog_area ? '<span style="background: #f3e8ff; color: #7e22ce; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🐩 Small Dogs</span>' : ''}
              ${park.has_large_dog_area ? '<span style="background: #fef3c7; color: #b45309; padding: 2px 8px; border-radius: 12px; font-size: 11px;">🐕‍🦺 Large Dogs</span>' : ''}
            </div>
          </div>
        `;
        
        infoWindowRef.current.setContent(content);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
        
        if (onParkSelect) {
          onParkSelect(park);
        }
      });

      markersRef.current.push(marker);
      bounds.extend(position);
    });

    // Fit map to show all markers
    if (validParks.length > 1) {
      mapInstanceRef.current.fitBounds(bounds, { padding: 50 });
    } else if (validParks.length === 1) {
      mapInstanceRef.current.setCenter({ lat: validParks[0].latitude!, lng: validParks[0].longitude! });
      mapInstanceRef.current.setZoom(14);
    }
  }, [parks, onParkSelect]);

  // Handle user location
  const handleLocateUser = useCallback(async () => {
    setLocatingUser(true);
    try {
      const position = await getCurrentLocation();
      if (!position) {
        console.error('Could not get user location');
        return;
      }
      const location = { lat: position.latitude, lng: position.longitude };
      setUserLocation(location);
      
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setCenter(location);
        mapInstanceRef.current.setZoom(12);

        // Add user location marker
        new window.google.maps.Marker({
          position: location,
          map: mapInstanceRef.current,
          title: 'Your Location',
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#3b82f6',
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 3,
          },
          zIndex: 1000,
        });
      }
    } catch (error) {
      console.error('Failed to get location:', error);
    } finally {
      setLocatingUser(false);
    }
  }, []);

  // Get count of parks with valid coordinates
  const validParkCount = parks.filter(p => p.latitude != null && p.longitude != null).length;

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapRef} className="absolute inset-0" />

      {/* Loading overlay */}
      {(loading || !mapLoaded) && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            <span className="text-sm text-muted-foreground">
              {!mapLoaded ? 'Loading map...' : 'Loading parks...'}
            </span>
          </div>
        </div>
      )}

      {/* Park count badge */}
      {!loading && mapLoaded && (
        <div className="absolute top-4 left-4 z-10">
          <Badge variant="secondary" className="bg-card/95 backdrop-blur shadow-md px-3 py-1.5">
            <PawPrint className="w-4 h-4 mr-1" />
            {validParkCount} Parks
          </Badge>
        </div>
      )}

      {/* Locate me button */}
      {mapLoaded && (
        <div className="absolute bottom-24 right-4 z-10">
          <Button
            size="icon"
            variant="secondary"
            className="bg-card/95 backdrop-blur shadow-md h-10 w-10 rounded-full"
            onClick={handleLocateUser}
            disabled={locatingUser}
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

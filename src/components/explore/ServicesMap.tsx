import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/hooks/useServices';
import { MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  isIOS, 
  getAppleMapsUrl, 
  getGoogleMapsUrl, 
  formatDistanceMiles, 
  calculateDistance 
} from '@/lib/navigation-utils';

interface ServicesMapProps {
  services: Service[];
  selectedCategory?: string | null;
  onServiceClick?: (id: number) => void;
}

// Category colors for markers
const CATEGORY_COLORS: Record<string, string> = {
  'Dog Walkers': '#3B82F6', // blue
  'Daycare': '#22C55E', // green
  'Vet Clinics': '#EF4444', // red
  'Trainers': '#F59E0B', // amber
  'Groomers': '#8B5CF6', // purple
};

export function ServicesMap({ services, selectedCategory, onServiceClick }: ServicesMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Fetch Mapbox token
  useEffect(() => {
    async function fetchToken() {
      try {
        const { data, error } = await supabase.functions.invoke('mapbox-token');
        if (error) throw error;
        if (data?.token) {
          setMapToken(data.token);
        } else {
          throw new Error('No token received');
        }
      } catch (err) {
        console.error('Failed to fetch Mapbox token:', err);
        setError('Failed to load map');
      }
    }
    fetchToken();
  }, []);

  // Get user location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.log('Geolocation error:', err.message);
          // Default to Boston area
          setUserLocation({ lat: 42.3601, lng: -71.0589 });
        },
        { enableHighAccuracy: false, timeout: 5000 }
      );
    } else {
      setUserLocation({ lat: 42.3601, lng: -71.0589 });
    }
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapToken || !mapContainer.current || map.current || !userLocation) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [userLocation.lng, userLocation.lat],
      zoom: 12,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken, userLocation]);

  // Create marker element
  const createMarkerElement = useCallback((service: Service) => {
    const el = document.createElement('div');
    const color = CATEGORY_COLORS[service.category] || '#6B7280';
    
    el.className = 'service-marker';
    el.innerHTML = `
      <div style="
        width: 32px;
        height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: transform 0.2s ease;
      ">
        ${service.is_verified ? `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : `
          <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
        `}
      </div>
    `;
    
    el.addEventListener('mouseenter', () => {
      el.querySelector('div')?.setAttribute('style', 
        el.querySelector('div')?.getAttribute('style')?.replace('transform: scale(1)', 'transform: scale(1.2)') || ''
      );
    });
    
    return el;
  }, []);

  // Calculate distances and sort by proximity (show all services, sorted by distance)
  const servicesWithDistance = useMemo(() => {
    return services
      .map(service => {
        const lat = service.is_verified && service.verified_latitude 
          ? service.verified_latitude 
          : service.latitude;
        const lng = service.is_verified && service.verified_longitude 
          ? service.verified_longitude 
          : service.longitude;
        
        if (!lat || !lng || isNaN(lat) || isNaN(lng) || !userLocation) {
          return { ...service, distanceMeters: undefined };
        }
        
        const distanceMeters = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
        return { ...service, distanceMeters };
      })
      .sort((a, b) => {
        // Sort by distance (undefined distances go last)
        if (a.distanceMeters === undefined && b.distanceMeters === undefined) return 0;
        if (a.distanceMeters === undefined) return 1;
        if (b.distanceMeters === undefined) return -1;
        return a.distanceMeters - b.distanceMeters;
      });
  }, [services, userLocation]);

  // Create popup content with navigation buttons
  const createPopupContent = useCallback((service: Service & { distanceMeters?: number }) => {
    const color = CATEGORY_COLORS[service.category] || '#6B7280';
    const lat = service.is_verified && service.verified_latitude 
      ? service.verified_latitude 
      : service.latitude;
    const lng = service.is_verified && service.verified_longitude 
      ? service.verified_longitude 
      : service.longitude;
    
    const distanceText = service.distanceMeters && service.distanceMeters !== Infinity 
      ? formatDistanceMiles(service.distanceMeters) 
      : '';
    
    const appleMapsUrl = lat && lng ? getAppleMapsUrl(lat, lng) : '';
    const googleMapsUrl = lat && lng ? getGoogleMapsUrl(lat, lng) : '';
    const showNavButtons = lat && lng;
    const isIOSDevice = isIOS();
    
    return `
      <div style="max-width: 280px; font-family: system-ui, -apple-system, sans-serif;" role="dialog" aria-labelledby="popup-title-${service.id}">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
          <h3 id="popup-title-${service.id}" style="font-weight: 700; font-size: 16px; margin: 0; flex: 1;">${service.name}</h3>
          ${service.is_verified ? `
            <span style="color: #22C55E; display: flex; align-items: center; gap: 2px; font-size: 11px;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              Verified
            </span>
          ` : ''}
        </div>
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="background: ${color}20; color: ${color}; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 500;">${service.category}</span>
          <span style="color: #F59E0B; font-size: 12px;">★ ${service.rating}</span>
        </div>
        ${service.enriched_description ? `
          <p style="font-size: 12px; color: #6B7280; margin: 8px 0; line-height: 1.4;">${service.enriched_description.slice(0, 100)}${service.enriched_description.length > 100 ? '...' : ''}</p>
        ` : ''}
        ${service.verified_address ? `<p style="font-size: 12px; color: #6B7280; margin: 8px 0; display: flex; align-items: center; gap: 4px;">📍 ${service.verified_address}</p>` : ''}
        
        ${distanceText ? `
          <p style="font-size: 12px; color: #3b82f6; font-weight: 500; margin: 8px 0;">📍 ${distanceText} away</p>
        ` : ''}
        
        ${showNavButtons ? `
          <div style="display: flex; gap: 8px; margin: 12px 0;">
            ${isIOSDevice ? `
              <a 
                href="${appleMapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  flex: 1;
                  padding: 8px 12px;
                  background: linear-gradient(135deg, #3b82f6, #2563eb);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 12px;
                  text-decoration: none;
                  text-align: center;
                  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                "
              >🍎 Apple Maps</a>
              <a 
                href="${googleMapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  flex: 1;
                  padding: 8px 12px;
                  background: linear-gradient(135deg, #22c55e, #16a34a);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 12px;
                  text-decoration: none;
                  text-align: center;
                  box-shadow: 0 2px 4px rgba(34, 197, 94, 0.3);
                "
              >🗺️ Google</a>
            ` : `
              <a 
                href="${googleMapsUrl}" 
                target="_blank" 
                rel="noopener noreferrer"
                style="
                  flex: 1;
                  padding: 8px 12px;
                  background: linear-gradient(135deg, #3b82f6, #2563eb);
                  color: white;
                  border: none;
                  border-radius: 8px;
                  font-weight: 600;
                  font-size: 12px;
                  text-decoration: none;
                  text-align: center;
                  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
                "
              >🧭 Navigate</a>
            `}
          </div>
        ` : ''}
        
        <button 
          onclick="window.dispatchEvent(new CustomEvent('service-click', { detail: ${service.id} }))"
          style="
            width: 100%;
            padding: 8px 16px;
            background: linear-gradient(135deg, #228B22, #2E8B57);
            color: white;
            border: none;
            border-radius: 20px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
          "
        >
          View Details
        </button>
      </div>
    `;
  }, []);

  // Handle popup button clicks
  useEffect(() => {
    const handleServiceClick = (e: CustomEvent) => {
      onServiceClick?.(e.detail);
    };
    
    window.addEventListener('service-click', handleServiceClick as EventListener);
    return () => window.removeEventListener('service-click', handleServiceClick as EventListener);
  }, [onServiceClick]);

  // Update markers when services change - use nearby services
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Filter services by category if selected
    const filteredServices = selectedCategory 
      ? servicesWithDistance.filter(s => s.category === selectedCategory)
      : servicesWithDistance;

    // Add markers for services with valid coordinates
    filteredServices.forEach(service => {
      const lat = service.is_verified && service.verified_latitude 
        ? service.verified_latitude 
        : service.latitude;
      const lng = service.is_verified && service.verified_longitude 
        ? service.verified_longitude 
        : service.longitude;

      if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

      const el = createMarkerElement(service);
      
      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map.current!);

      el.addEventListener('click', () => {
        // Close existing popup
        popupRef.current?.remove();
        
        // Create new popup
        popupRef.current = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          maxWidth: '320px',
        })
          .setLngLat([lng, lat])
          .setHTML(createPopupContent(service))
          .addTo(map.current!);
      });

      markersRef.current.push(marker);
    });

    // Fit bounds to show all markers + user location
    if (markersRef.current.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      
      // Include user location in bounds
      if (userLocation) {
        bounds.extend([userLocation.lng, userLocation.lat]);
      }
      
      markersRef.current.forEach(marker => {
        bounds.extend(marker.getLngLat());
      });
      
      if (markersRef.current.length > 1 || userLocation) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 13 });
      }
    }
  }, [servicesWithDistance, selectedCategory, createMarkerElement, createPopupContent, userLocation]);

  // Locate me function
  const handleLocateMe = useCallback(() => {
    if (!map.current || !userLocation) return;
    
    map.current.flyTo({
      center: [userLocation.lng, userLocation.lat],
      zoom: 13,
      duration: 1000,
    });
  }, [userLocation]);

  if (error) {
    return (
      <div className="relative rounded-xl overflow-hidden border border-border h-[500px] flex items-center justify-center bg-muted">
        <div className="text-center">
          <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative rounded-xl overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-[500px]" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Locate Me Button */}
      <Button
        variant="secondary"
        size="sm"
        className="absolute bottom-4 right-4 rounded-full shadow-lg"
        onClick={handleLocateMe}
      >
        <Navigation className="w-4 h-4 mr-2" />
        Locate Me
      </Button>

      {/* Legend */}
      <div className="absolute top-4 left-4 bg-card/95 backdrop-blur rounded-lg p-3 shadow-lg">
        <p className="text-xs font-semibold mb-2">Categories</p>
        <div className="space-y-1">
          {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
            <div key={category} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full border-2 border-white shadow-sm" 
                style={{ background: color }}
              />
              <span className="text-muted-foreground">{category}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

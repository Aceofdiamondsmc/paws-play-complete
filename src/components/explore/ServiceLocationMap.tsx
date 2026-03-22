import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isIOS, getAppleMapsUrl, getGoogleMapsUrl } from '@/lib/navigation-utils';

interface ServiceLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  isVerified?: boolean;
  address?: string;
}

const PAW_SVG = `
  <svg width="18" height="18" viewBox="0 0 24 24" fill="white" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="7" cy="5" rx="2.5" ry="3" />
    <ellipse cx="17" cy="5" rx="2.5" ry="3" />
    <ellipse cx="3.5" cy="11" rx="2.2" ry="2.8" />
    <ellipse cx="20.5" cy="11" rx="2.2" ry="2.8" />
    <path d="M12 22c-4 0-7-3.5-7-6.5 0-2.5 2-5.5 4-6.5 1-.5 2.5-1 3-1s2 .5 3 1c2 1 4 4 4 6.5 0 3-3 6.5-7 6.5z" />
  </svg>
`;

export function ServiceLocationMap({ latitude, longitude, name, isVerified, address }: ServiceLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [showFallbackInfo, setShowFallbackInfo] = useState(false);

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

  useEffect(() => {
    if (!mapToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapToken;

    const timeoutId = setTimeout(() => {
      if (!mapLoaded) {
        console.warn('Map load slow — showing fallback info');
        setShowFallbackInfo(true);
        setIsLoading(false);
      }
    }, 20000);

    try {
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [longitude, latitude],
        zoom: 15,
        interactive: false,
      });

      const markerEl = document.createElement('div');
      markerEl.innerHTML = `
        <div style="
          width: 40px;
          height: 40px;
          background: #228B22;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          ${isVerified ? PAW_SVG : `<div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>`}
        </div>
      `;

      new mapboxgl.Marker({ element: markerEl })
        .setLngLat([longitude, latitude])
        .addTo(map.current);

      map.current.on('load', () => {
        clearTimeout(timeoutId);
        setIsLoading(false);
        setMapLoaded(true);
        setShowFallbackInfo(false);
      });
    } catch (err) {
      console.error('Map init error:', err);
      clearTimeout(timeoutId);
      setError('Failed to load map');
      setIsLoading(false);
    }

    return () => {
      clearTimeout(timeoutId);
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken, latitude, longitude, isVerified, mapLoaded]);

  const handleGetDirections = () => {
    if (address) {
      const query = encodeURIComponent(`${name}, ${address}`);
      if (isIOS()) {
        const useAppleMaps = window.confirm(
          `Navigate to ${name}?\n\nPress OK for Apple Maps\nPress Cancel for Google Maps`
        );
        if (useAppleMaps) {
          window.open(`https://maps.apple.com/?address=${encodeURIComponent(address)}&q=${encodeURIComponent(name)}`, '_blank');
        } else {
          window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
        }
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }
    } else {
      if (isIOS()) {
        const useAppleMaps = window.confirm(
          `Navigate to ${name}?\n\nPress OK for Apple Maps\nPress Cancel for Google Maps`
        );
        if (useAppleMaps) {
          window.open(getAppleMapsUrl(latitude, longitude), '_blank');
        } else {
          window.open(getGoogleMapsUrl(latitude, longitude), '_blank');
        }
      } else {
        window.open(getGoogleMapsUrl(latitude, longitude), '_blank');
      }
    }
  };

  if (error) {
    return (
      <div className="h-40 bg-muted rounded-lg flex flex-col items-center justify-center gap-3 p-4">
        <MapPin className="w-8 h-8 text-muted-foreground" />
        {address && <p className="text-sm text-center text-muted-foreground">{address}</p>}
        {!address && <p className="text-sm text-muted-foreground">{error}</p>}
        <Button size="sm" className="rounded-full shadow-lg" onClick={handleGetDirections}>
          <Navigation2 className="w-4 h-4 mr-1" />
          Directions
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative">
        <div ref={mapContainer} className="h-40 rounded-lg overflow-hidden" />
        
        {isLoading && (
          <div className="absolute inset-0 bg-muted rounded-lg flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        <Button
          size="sm"
          className="absolute bottom-2 right-2 rounded-full shadow-lg"
          onClick={handleGetDirections}
        >
          <Navigation2 className="w-4 h-4 mr-1" />
          Directions
        </Button>
      </div>

      {showFallbackInfo && address && (
        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
          <MapPin className="w-3 h-3" /> {address}
        </p>
      )}
    </div>
  );
}

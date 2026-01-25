import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { MapPin, Loader2, Navigation2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ServiceLocationMapProps {
  latitude: number;
  longitude: number;
  name: string;
  isVerified?: boolean;
}

export function ServiceLocationMap({ latitude, longitude, name, isVerified }: ServiceLocationMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  
  const [mapToken, setMapToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Initialize map
  useEffect(() => {
    if (!mapToken || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = mapToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 15,
      interactive: false, // Static map for location display
    });

    // Add marker
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
        ${isVerified ? `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        ` : `
          <div style="width: 10px; height: 10px; background: white; border-radius: 50%;"></div>
        `}
      </div>
    `;

    new mapboxgl.Marker({ element: markerEl })
      .setLngLat([longitude, latitude])
      .addTo(map.current);

    map.current.on('load', () => {
      setIsLoading(false);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapToken, latitude, longitude, isVerified]);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${encodeURIComponent(name)}`;
    window.open(url, '_blank');
  };

  if (error) {
    return (
      <div className="h-40 bg-muted rounded-lg flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  return (
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
  );
}

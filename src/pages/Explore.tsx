import { useState, useEffect, useRef, useCallback } from 'react';
import { Compass, Search, Navigation, X, Droplets, Fence, PawPrint, TreePine, Star, ChevronRight, Dog, Scissors, Stethoscope, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useParks } from '@/hooks/useParks';
import type { Park } from '@/types';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Get Mapbox token from environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Service category pills
const serviceCategories = [
  { id: 'walkers', label: 'Dog Walkers', icon: Dog, color: 'bg-primary/10 text-primary' },
  { id: 'sitters', label: 'Dog Sitters', icon: Home, color: 'bg-accent/10 text-accent' },
  { id: 'vets', label: 'Vet Clinics', icon: Stethoscope, color: 'bg-green-100 text-green-700' },
  { id: 'daycare', label: 'Doggy Daycare', icon: Dog, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'groomers', label: 'Groomers', icon: Scissors, color: 'bg-purple-100 text-purple-700' },
];

// Paw print SVG for custom marker
const createPawMarkerElement = () => {
  const el = document.createElement('div');
  el.className = 'paw-marker';
  el.innerHTML = `
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="12" fill="hsl(var(--primary))" />
      <path d="M12 14.5c-1.5 0-2.7 1.2-3.3 2.5-.3.6.1 1.2.8 1.2h5c.7 0 1.1-.6.8-1.2-.6-1.3-1.8-2.5-3.3-2.5z" fill="white"/>
      <ellipse cx="8.5" cy="11" rx="1.5" ry="2" fill="white"/>
      <ellipse cx="15.5" cy="11" rx="1.5" ry="2" fill="white"/>
      <ellipse cx="10" cy="8" rx="1.2" ry="1.5" fill="white"/>
      <ellipse cx="14" cy="8" rx="1.2" ry="1.5" fill="white"/>
    </svg>
  `;
  el.style.cursor = 'pointer';
  el.style.transform = 'translate(-50%, -50%)';
  return el;
};

// Amenity badge config
const amenityConfig: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  is_fenced: { icon: Fence, label: 'Fully Fenced', color: 'bg-green-100 text-green-700 border-green-200' },
  has_water_fountain: { icon: Droplets, label: 'Water Station', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  is_dog_friendly: { icon: PawPrint, label: 'Dog Friendly', color: 'bg-orange-100 text-orange-700 border-orange-200' },
};

export default function Explore() {
  const { allParks, loading } = useParks();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    if (!MAPBOX_TOKEN) {
      console.error('Mapbox token not found');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Get park amenities for badges
  const getParkAmenities = useCallback((park: Park) => {
    const amenities: { key: string; icon: React.ElementType; label: string; color: string }[] = [];
    
    if (park.is_fenced) {
      amenities.push({ key: 'is_fenced', ...amenityConfig.is_fenced });
    }
    if (park.has_water_fountain) {
      amenities.push({ key: 'has_water_fountain', ...amenityConfig.has_water_fountain });
    }
    if (park.is_dog_friendly) {
      amenities.push({ key: 'is_dog_friendly', ...amenityConfig.is_dog_friendly });
    }
    
    return amenities.slice(0, 3); // Top 3 amenities
  }, []);

  // Add park markers
  useEffect(() => {
    if (!map.current || !mapLoaded || loading) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const parksWithCoords = allParks.filter(
      (park): park is Park & { latitude: number; longitude: number } =>
        park.latitude != null && park.longitude != null
    );

    parksWithCoords.forEach(park => {
      const markerEl = createPawMarkerElement();
      
      markerEl.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPark(park);
        
        // Fly to park location
        map.current?.flyTo({
          center: [park.longitude, park.latitude],
          zoom: 14,
          duration: 1000,
        });
      });

      const marker = new mapboxgl.Marker({ element: markerEl })
        .setLngLat([park.longitude, park.latitude])
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all parks if there are any
    if (parksWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      parksWithCoords.forEach(park => {
        bounds.extend([park.longitude, park.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50, maxZoom: 12 });
    }
  }, [allParks, mapLoaded, loading]);

  // Locate user
  const locateUser = useCallback(() => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { longitude, latitude } = position.coords;
        setUserLocation([longitude, latitude]);
        
        if (map.current) {
          // Add or update user location marker
          const existingMarker = document.querySelector('.user-location-marker');
          if (existingMarker) existingMarker.remove();

          const userMarkerEl = document.createElement('div');
          userMarkerEl.className = 'user-location-marker';
          userMarkerEl.innerHTML = `
            <div style="
              width: 20px;
              height: 20px;
              background: hsl(var(--primary));
              border: 3px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            "></div>
            <div style="
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              width: 40px;
              height: 40px;
              background: hsl(var(--primary) / 0.2);
              border-radius: 50%;
              animation: pulse 2s infinite;
            "></div>
          `;

          new mapboxgl.Marker({ element: userMarkerEl })
            .setLngLat([longitude, latitude])
            .addTo(map.current);

          map.current.flyTo({
            center: [longitude, latitude],
            zoom: 14,
            duration: 1500,
          });
        }
        
        setIsLocating(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to get your location. Please enable location services.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  // Filter parks by search
  const filteredParks = allParks.filter(park =>
    park.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    park.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-card/95 backdrop-blur border-b border-border p-4 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Compass className="w-6 h-6 text-primary" />
            Explore
          </h1>
          <Button
            variant="outline"
            size="icon"
            onClick={locateUser}
            disabled={isLocating}
            className="rounded-full"
          >
            <Navigation className={`w-5 h-5 ${isLocating ? 'animate-pulse' : ''}`} />
          </Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search dog parks..."
            className="pl-10 rounded-full"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Service Category Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {serviceCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap font-medium transition-all ${cat.color} hover:opacity-80`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />
        
        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-10">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        {/* Park count badge */}
        {!loading && (
          <div className="absolute top-4 left-4 z-10">
            <Badge variant="secondary" className="bg-card/95 backdrop-blur shadow-md px-3 py-1.5">
              <TreePine className="w-4 h-4 mr-1" />
              {allParks.length} Parks
            </Badge>
          </div>
        )}

        {/* Selected Park Popup */}
        {selectedPark && (
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <Card className="p-4 shadow-xl border-2 border-primary/20 bg-card">
              <button 
                onClick={() => setSelectedPark(null)}
                className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex gap-4">
                {selectedPark.image_url ? (
                  <img 
                    src={selectedPark.image_url} 
                    alt={selectedPark.name}
                    className="w-20 h-20 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-xl bg-primary/10 flex items-center justify-center">
                    <PawPrint className="w-8 h-8 text-primary" />
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate">{selectedPark.name}</h3>
                  
                  {selectedPark.rating && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span>{selectedPark.rating.toFixed(1)}</span>
                    </div>
                  )}
                  
                  {selectedPark.address && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {selectedPark.address}
                    </p>
                  )}
                  
                  {/* Amenity Badges */}
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {getParkAmenities(selectedPark).map(amenity => {
                      const Icon = amenity.icon;
                      return (
                        <Badge 
                          key={amenity.key} 
                          variant="outline"
                          className={`text-xs ${amenity.color}`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {amenity.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
                
                <Button size="icon" variant="ghost" className="self-center">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Parks List (collapsible) */}
      {searchQuery && filteredParks.length > 0 && (
        <div className="absolute bottom-20 left-4 right-4 max-h-60 overflow-y-auto z-10 bg-card rounded-xl shadow-xl border">
          {filteredParks.slice(0, 5).map(park => (
            <button
              key={park.id}
              onClick={() => {
                setSelectedPark(park);
                setSearchQuery('');
                if (park.latitude && park.longitude && map.current) {
                  map.current.flyTo({
                    center: [park.longitude, park.latitude],
                    zoom: 14,
                  });
                }
              }}
              className="w-full p-3 text-left hover:bg-muted border-b last:border-b-0 flex items-center gap-3"
            >
              <PawPrint className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{park.name}</p>
                {park.address && (
                  <p className="text-sm text-muted-foreground truncate">{park.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Add pulse animation styles */}
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .paw-marker:hover svg circle {
          fill: hsl(var(--primary) / 0.8);
        }
        .paw-marker {
          transition: transform 0.2s ease;
        }
        .paw-marker:hover {
          transform: translate(-50%, -50%) scale(1.1);
        }
      `}</style>
    </div>
  );
}

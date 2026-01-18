import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, List, Star, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParks } from '@/hooks/useParks';
import { cn } from '@/lib/utils';
import { createPawMarker, createPopupHTML } from '@/components/parks/ParkMarkers';
import { ParkInfoPanel } from '@/components/parks/ParkInfoPanel';
import type { ParkFilter, FilterOption, Park } from '@/types';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

const filterOptions: FilterOption[] = [
  { id: 'fenced', label: 'Fully Fenced', icon: 'Fence' },
  { id: 'water', label: 'Water Station', icon: 'Droplets' },
  { id: 'small-dogs', label: 'Small Dog Area', icon: 'Dog' },
  { id: 'large-dogs', label: 'Large Dog Area', icon: 'Dog' },
  { id: 'agility', label: 'Agility Equipment', icon: 'Dumbbell' },
  { id: 'parking', label: 'Parking', icon: 'Car' },
  { id: 'grass', label: 'Grass Surface', icon: 'TreePine' },
];

const iconMap: Record<string, React.ElementType> = {
  Fence, Droplets, Dog, TreePine, Car, Dumbbell
};


export default function Parks() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [selectedPark, setSelectedPark] = useState<Park | null>(null);
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const geolocateControlRef = useRef<mapboxgl.GeolocateControl | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { parks, loading, activeFilters, toggleFilter } = useParks();

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || viewMode !== 'map') return;
    if (map.current) return; // Already initialized

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/paws-play-repeat/cmkd8den2000201slhb1k29ty',
      center: [-98.5795, 39.8283], // Center of US
      zoom: 4,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add GeolocateControl
    const geolocateControl = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true,
      showUserLocation: true,
      showAccuracyCircle: true
    });
    
    geolocateControlRef.current = geolocateControl;
    map.current.addControl(geolocateControl, 'top-right');

    // Fix blank map on load by forcing recalculation of container size
    map.current.on('load', () => {
      map.current?.resize();
      setMapLoaded(true);
      
      // Programmatically trigger geolocate to ask for location permission
      // and fly to user's current position
      setTimeout(() => {
        geolocateControl.trigger();
      }, 500);
    });

    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      geolocateControlRef.current = null;
      map.current?.remove();
      map.current = null;
      setMapLoaded(false);
    };
  }, [viewMode]);

  // Update markers when parks change
  useEffect(() => {
    if (!map.current || !mapLoaded || viewMode !== 'map') return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add park markers
    const parksWithCoords = parks.filter(park => park.latitude != null && park.longitude != null);
    
    parksWithCoords.forEach(park => {
      const isSelected = selectedPark?.id === park.id;
      const el = createPawMarker(isSelected);
      
      el.addEventListener('mouseenter', () => {
        if (!isSelected) el.style.transform = 'scale(1.15)';
      });
      el.addEventListener('mouseleave', () => {
        if (!isSelected) el.style.transform = 'scale(1)';
      });
      
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        setSelectedPark(park);
      });

      const popup = new mapboxgl.Popup({ 
        offset: 25,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px'
      }).setHTML(createPopupHTML(park));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([park.longitude!, park.latitude!])
        .setPopup(popup)
        .addTo(map.current!);

      markersRef.current.push(marker);
    });

    // Fit bounds to show all filtered parks
    if (parksWithCoords.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      parksWithCoords.forEach(park => {
        bounds.extend([park.longitude!, park.latitude!]);
      });
      
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { 
          padding: { top: 50, bottom: 50, left: 50, right: 50 }, 
          maxZoom: 13,
          duration: 1000
        });
      }
    }
  }, [parks, mapLoaded, viewMode, selectedPark]);

  // Removed manual locateUser - now using mapbox GeolocateControl

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 space-y-3 z-10">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-primary" />
            Dog Parks
          </h1>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'map' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('map')}
              className="rounded-full"
            >
              <MapPin className="w-4 h-4 mr-1" />
              Map
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-full"
            >
              <List className="w-4 h-4 mr-1" />
              List
            </Button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {filterOptions.map(filter => {
            const Icon = iconMap[filter.icon];
            const isActive = activeFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => toggleFilter(filter.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-md" 
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                )}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>

        {/* Active filter count */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {parks.length} parks match your filters
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
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
                <PawPrint className="w-4 h-4 mr-1" />
                {parks.length} Parks
              </Badge>
            </div>
          )}

          {/* Selected Park Info Panel with AI Description */}
          {selectedPark && (
            <ParkInfoPanel 
              park={selectedPark} 
              onClose={() => setSelectedPark(null)} 
            />
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : parks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">No parks found matching your filters</p>
              <p className="text-sm mt-1">Try removing some filters to see more parks</p>
            </div>
          ) : (
            parks.map(park => (
              <Card key={park.id} className="p-4 card-playful">
                <div className="flex gap-4">
                  {park.image_url ? (
                    <img
                      src={park.image_url}
                      alt={park.name}
                      className="w-24 h-24 object-cover rounded-xl"
                    />
                  ) : (
                    <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center">
                      <PawPrint className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg truncate">{park.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {park.address || 'Dog Park'}
                    </p>
                    {park.rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-warning fill-warning" />
                        <span className="text-sm font-medium">{park.rating.toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">
                          ({park.user_ratings_total || 0} reviews)
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {park.is_fenced && (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                          <Fence className="w-3 h-3 mr-1" />
                          Fenced
                        </Badge>
                      )}
                      {park.has_water_fountain && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          <Droplets className="w-3 h-3 mr-1" />
                          Water
                        </Badge>
                      )}
                      {park.is_dog_friendly && (
                        <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                          <Dog className="w-3 h-3 mr-1" />
                          Dog Friendly
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Pulse animation styles */}
      <style>{`
        @keyframes pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(2); opacity: 0; }
        }
        .mapboxgl-popup-content {
          border-radius: 12px !important;
          padding: 0 !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .mapboxgl-popup-close-button {
          font-size: 18px;
          padding: 4px 8px;
        }
      `}</style>
    </div>
  );
}

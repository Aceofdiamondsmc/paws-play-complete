import { useState, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, List, Filter, Star, Fence, Droplets, Dog, TreePine, Car, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useParks } from '@/hooks/useParks';
import { cn } from '@/lib/utils';
import type { ParkFilter, FilterOption } from '@/types';

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

const iconMap: Record<string, any> = {
  Fence, Droplets, Dog, TreePine, Car, Dumbbell
};

export default function Parks() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { parks, loading, activeFilters, toggleFilter } = useParks();

  useEffect(() => {
    if (!mapContainer.current || !MAPBOX_TOKEN || viewMode !== 'map') return;

    mapboxgl.accessToken = MAPBOX_TOKEN;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [-122.4194, 37.7749],
      zoom: 11,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
      }),
      'top-right'
    );

    return () => {
      map.current?.remove();
    };
  }, [viewMode]);

  useEffect(() => {
    if (!map.current || viewMode !== 'map') return;

    // Clear existing markers
    const markers = document.querySelectorAll('.mapboxgl-marker');
    markers.forEach(m => m.remove());

    // Add park markers
    parks.forEach(park => {
      if (!park.latitude || !park.longitude) return;

      const el = document.createElement('div');
      el.className = 'w-10 h-10 bg-primary rounded-full flex items-center justify-center shadow-lg cursor-pointer transform hover:scale-110 transition-transform';
      el.innerHTML = '<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>';

      new mapboxgl.Marker(el)
        .setLngLat([park.longitude, park.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div class="p-2">
              <h3 class="font-bold text-sm">${park.name}</h3>
              <p class="text-xs text-gray-600">${park.address || 'Dog Park'}</p>
              ${park.rating ? `<div class="flex items-center gap-1 mt-1"><span class="text-yellow-500">★</span><span class="text-xs">${park.rating.toFixed(1)}</span></div>` : ''}
            </div>
          `)
        )
        .addTo(map.current!);
    });

    // Fit to parks if available
    if (parks.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      parks.forEach(park => {
        if (park.latitude && park.longitude) {
          bounds.extend([park.longitude, park.latitude]);
        }
      });
      if (!bounds.isEmpty()) {
        map.current.fitBounds(bounds, { padding: 50, maxZoom: 14 });
      }
    }
  }, [parks, viewMode]);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Dog Parks</h1>
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
                  "filter-pill flex items-center gap-1.5 whitespace-nowrap",
                  isActive && "active"
                )}
              >
                <Icon className="w-4 h-4" />
                {filter.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div ref={mapContainer} className="flex-1" />
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : parks.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No parks found matching your filters</p>
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
                    <div className="w-24 h-24 bg-muted rounded-xl flex items-center justify-center">
                      <MapPin className="w-8 h-8 text-muted-foreground" />
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
                    <div className="flex gap-2 mt-2">
                      {park.is_fenced && (
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">Fenced</span>
                      )}
                      {park.has_water_fountain && (
                        <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">Water</span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
}

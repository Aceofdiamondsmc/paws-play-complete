import { useState, useEffect } from 'react';
import { MapPin, List, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParks } from '@/hooks/useParks';
import { useParksPaginated } from '@/hooks/useParksPaginated';
import { ParksMap } from '@/components/parks/ParksMap';
import { ParksList } from '@/components/parks/ParksList';
import { cn } from '@/lib/utils';
import { getCurrentLocation } from '@/lib/spatial-utils';
import type { FilterOption } from '@/types';

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
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list'); // Default to list view
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  
  // Get user location early for proximity sorting
  useEffect(() => {
    getCurrentLocation()
      .then(location => {
        if (location) {
          setUserLocation({ lat: location.latitude, lng: location.longitude });
        }
      })
      .finally(() => setLocationLoading(false));
  }, []);

  // Use paginated hook for list view with user location for proximity sorting
  const mapHook = useParks();
  const listHook = useParksPaginated(userLocation);
  
  // Use the appropriate hook based on view mode
  const activeHook = viewMode === 'map' ? mapHook : listHook;

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Header with backdrop blur */}
      <div className="sticky top-0 z-20 bg-card/95 backdrop-blur-md border-b border-border p-4 space-y-3 shrink-0">
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
            const isActive = activeHook.activeFilters.includes(filter.id);
            return (
              <button
                key={filter.id}
                onClick={() => activeHook.toggleFilter(filter.id)}
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
        {activeHook.activeFilters.length > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {activeHook.parks.length} parks match your filters
            </Badge>
          </div>
        )}
      </div>

      {/* Content - non-blocking, bottom nav always accessible */}
      {viewMode === 'map' ? (
        <div className="flex-1 relative">
          <ParksMap parks={mapHook.parks} loading={mapHook.loading} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4">
          <ParksList
            parks={listHook.parks}
            loading={listHook.loading}
            loadingMore={listHook.loadingMore}
            hasMore={listHook.hasMore}
            userLocation={userLocation}
            onLoadMore={listHook.loadMore}
          />
        </div>
      )}
    </div>
  );
}

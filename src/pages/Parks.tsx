import { useState, useEffect } from 'react';
import { MapPin, List, Star, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParks } from '@/hooks/useParks';
import { ParksMap } from '@/components/parks/ParksMap';
import { cn } from '@/lib/utils';
import { openNavigation, calculateDistance, formatDistanceMiles } from '@/lib/navigation-utils';
import { getCurrentLocation } from '@/lib/spatial-utils';
import type { ParkFilter, FilterOption, Park } from '@/types';

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
  const { parks, loading, activeFilters, toggleFilter } = useParks();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Get user location for distance calculations
  useEffect(() => {
    getCurrentLocation().then(location => {
      if (location) {
        setUserLocation({ lat: location.latitude, lng: location.longitude });
      }
    });
  }, []);

  // Calculate distance from user to a park
  const getDistanceToPark = (park: Park): number | undefined => {
    if (!userLocation || !park.latitude || !park.longitude) return undefined;
    return calculateDistance(userLocation.lat, userLocation.lng, park.latitude, park.longitude);
  };

  // Handle navigation button click
  const handleNavigate = (park: Park) => {
    if (park.latitude && park.longitude) {
      openNavigation(park.latitude, park.longitude, park.name || 'Dog Park');
    }
  };

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
          <ParksMap parks={parks} loading={loading} />
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
            parks.map(park => {
              const distance = getDistanceToPark(park);
              return (
                <Card key={park.id} className="p-4 card-playful">
                  <div className="flex gap-4">
                    {park.image_url ? (
                      <img
                        src={park.image_url}
                        alt={park.name || 'Dog Park'}
                        className="w-24 h-24 object-cover rounded-xl"
                      />
                    ) : (
                      <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center">
                        <PawPrint className="w-8 h-8 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-lg truncate">{park.name}</h3>
                        {distance !== undefined && (
                          <Badge variant="secondary" className="shrink-0 text-xs">
                            📍 {formatDistanceMiles(distance)}
                          </Badge>
                        )}
                      </div>
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
                        {park.is_fully_fenced && (
                          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                            <Fence className="w-3 h-3 mr-1" />
                            Fenced
                          </Badge>
                        )}
                        {park.has_water_station && (
                          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                            <Droplets className="w-3 h-3 mr-1" />
                            Water
                          </Badge>
                        )}
                        {park.has_small_dog_area && (
                          <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                            <Dog className="w-3 h-3 mr-1" />
                            Small Dogs
                          </Badge>
                        )}
                        {park.has_large_dog_area && (
                          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                            <Dog className="w-3 h-3 mr-1" />
                            Large Dogs
                          </Badge>
                        )}
                        {park.has_agility_equipment && (
                          <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200">
                            <Dumbbell className="w-3 h-3 mr-1" />
                            Agility
                          </Badge>
                        )}
                        {park.has_parking && (
                          <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200">
                            <Car className="w-3 h-3 mr-1" />
                            Parking
                          </Badge>
                        )}
                        {park.has_grass_surface && (
                          <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                            <TreePine className="w-3 h-3 mr-1" />
                            Grass
                          </Badge>
                        )}
                      </div>
                      
                      {/* Navigate Button */}
                      {park.latitude && park.longitude && (
                        <Button
                          size="sm"
                          className="mt-3 bg-blue-500 hover:bg-blue-600 text-white rounded-full"
                          onClick={() => handleNavigate(park)}
                        >
                          <Navigation className="w-4 h-4 mr-1.5" />
                          Navigate
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

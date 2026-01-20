import { useState } from 'react';
import { MapPin, List, Star, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useParks } from '@/hooks/useParks';
import { cn } from '@/lib/utils';
import type { ParkFilter, FilterOption } from '@/types';

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
          {/* Google My Maps Iframe */}
          <iframe
            src="https://www.google.com/maps/d/u/0/embed?mid=10wM4h_PU2KV-MWnX0Rk7jtL-ksguNac&ehbc=2E312F"
            width="100%"
            height="100%"
            style={{ border: 0, position: 'absolute', inset: 0 }}
            allowFullScreen
            loading="lazy"
            title="Dog Parks Map"
          />
          
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
    </div>
  );
}

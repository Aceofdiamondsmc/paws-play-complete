import { useState, useMemo } from 'react';
import { MapPin, List, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint, Loader2, MapPinOff, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useParks } from '@/hooks/useParks';
import { useNearbyParks } from '@/hooks/useNearbyParks';
import { ParksMap } from '@/components/parks/ParksMap';
import { ParkListItem } from '@/components/parks/ParkListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
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

// Skeleton for list items
function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border">
      <Skeleton className="w-16 h-16 rounded-lg shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-1">
          <Skeleton className="h-5 w-14 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
      </div>
      <Skeleton className="w-16 h-9 rounded-full" />
    </div>
  );
}

export default function Parks() {
  const [viewMode, setViewMode] = useState<'map' | 'list'>('list');
  
  // Map view uses the full parks hook
  const mapHook = useParks();
  
  // List view uses the new simplified nearby hook
  const {
    parks,
    loading,
    locationLoading,
    locationError,
    userLocation,
    activeFilters,
    toggleFilter,
    searchNearMe,
    showMore,
    hasMore,
    totalMatching,
    localParksCount,
  } = useNearbyParks();

  return (
    <div className="h-screen flex flex-col">
      {/* Sticky Header */}
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

        {/* Filter Pills - only show for list view */}
        {viewMode === 'list' && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {filterOptions.map(filter => {
              const Icon = iconMap[filter.icon];
              const isActive = activeFilters.includes(filter.id as any);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id as any)}
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
        )}

        {/* Results count */}
        {viewMode === 'list' && !loading && parks.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              Showing {parks.length} of {totalMatching} parks
            </Badge>
            {userLocation && localParksCount > 0 && (
              <Badge variant="default" className="text-xs bg-primary/90">
                🐕 {localParksCount} within 50 miles
              </Badge>
            )}
            {userLocation && (
              <Badge variant="outline" className="text-xs">
                📍 Sorted by distance
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div className="flex-1 relative">
          <ParksMap parks={mapHook.parks} loading={mapHook.loading} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Search Near Me Button - prominent when no location */}
          {!userLocation && !locationLoading && (
            <div className="p-4 pb-2">
              <Button
                onClick={searchNearMe}
                size="lg"
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 text-base font-semibold shadow-lg"
              >
                <Search className="w-5 h-5 mr-2" />
                Search Dog Parks Near Me
              </Button>
              {locationError && (
                <p className="text-sm text-destructive mt-2 text-center flex items-center justify-center gap-1">
                  <MapPinOff className="w-4 h-4" />
                  {locationError}
                </p>
              )}
            </div>
          )}

          {/* Location Loading State */}
          {locationLoading && (
            <div className="p-4">
              <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Finding your location...</span>
              </div>
            </div>
          )}

          {/* Parks List */}
          <div className="p-4 space-y-2">
            {/* Loading skeletons */}
            {loading && parks.length === 0 && (
              <>
                {[1, 2, 3, 4, 5].map(i => (
                  <ListItemSkeleton key={i} />
                ))}
              </>
            )}

            {/* Nearby Parks Section */}
            {userLocation && localParksCount > 0 && parks.length > 0 && !loading && (
              <div className="flex items-center gap-2 pb-1">
                <span className="text-sm font-semibold text-primary">Nearby</span>
                <span className="text-xs text-muted-foreground">Within 50 miles</span>
              </div>
            )}

            {/* Parks - render with separator between local and far */}
            {parks.map((park, index) => {
              // Check if this is the first "far" park (after local parks end)
              const isFirstFarPark = userLocation && 
                localParksCount > 0 && 
                index === localParksCount && 
                parks.length > localParksCount;

              return (
                <div key={park.id}>
                  {isFirstFarPark && (
                    <div className="py-4">
                      <Separator className="mb-3" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-muted-foreground">More Parks</span>
                        <span className="text-xs text-muted-foreground">Beyond 50 miles</span>
                      </div>
                    </div>
                  )}
                  <ParkListItem park={park} />
                </div>
              );
            })}

            {/* Show More Button */}
            {hasMore && !loading && (
              <Button
                variant="outline"
                onClick={showMore}
                className="w-full mt-4 rounded-xl"
              >
                Show More Parks
              </Button>
            )}

            {/* Empty State */}
            {!loading && !locationLoading && parks.length === 0 && userLocation && (
              <div className="text-center py-12 text-muted-foreground">
                <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No parks found matching your filters</p>
                <p className="text-sm mt-1">Try removing some filters to see more parks</p>
              </div>
            )}

            {/* End of list */}
            {!hasMore && parks.length > 0 && !loading && (
              <p className="text-center text-sm text-muted-foreground py-4">
                You've seen all {parks.length} matching parks! 🐕
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

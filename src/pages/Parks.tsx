import { useState } from 'react';
import { MapPin, List, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint, Loader2, MapPinOff, Search, Plus } from 'lucide-react';
import { SuggestParkModal } from '@/components/parks/SuggestParkModal';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useNearbyParks } from '@/hooks/useNearbyParks';
import { ParksMap } from '@/components/parks/ParksMap';
import { ParkListItem } from '@/components/parks/ParkListItem';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
const filterOptions = [
  { id: 'fenced', label: 'Fully Fenced', icon: 'Fence', color: 'bg-amber-100 text-amber-600', activeColor: 'bg-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.5)]' },
  { id: 'water', label: 'Water Station', icon: 'Droplets', color: 'bg-blue-100 text-blue-600', activeColor: 'bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.5)]' },
  { id: 'small-dogs', label: 'Small Dog Area', icon: 'Dog', color: 'bg-pink-100 text-pink-600', activeColor: 'bg-pink-500 text-white shadow-[0_0_20px_rgba(236,72,153,0.5)]' },
  { id: 'large-dogs', label: 'Large Dog Area', icon: 'Dog', color: 'bg-indigo-100 text-indigo-600', activeColor: 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]' },
  { id: 'agility', label: 'Agility Equipment', icon: 'Dumbbell', color: 'bg-orange-100 text-orange-600', activeColor: 'bg-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.5)]' },
  { id: 'parking', label: 'Parking', icon: 'Car', color: 'bg-slate-100 text-slate-600', activeColor: 'bg-slate-500 text-white shadow-[0_0_20px_rgba(100,116,139,0.5)]' },
  { id: 'grass', label: 'Grass Surface', icon: 'TreePine', color: 'bg-green-100 text-green-600', activeColor: 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.5)]' },
];

const iconMap: Record<string, React.ElementType> = {
  Fence, Droplets, Dog, TreePine, Car, Dumbbell
};

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
  const [suggestOpen, setSuggestOpen] = useState(false);
  const { user } = useAuth();
  
  const {
    parks,
    allParks,
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
    tier1Count,
    tier2Count,
    tier3Count,
    dataReady,
    detectedCity,
    detectedState,
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

        {/* Filter Pills - only show for list view when data is ready */}
        {viewMode === 'list' && dataReady && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {filterOptions.map(filter => {
              const Icon = iconMap[filter.icon];
              const isActive = activeFilters.includes(filter.id as any);
              return (
                <button
                  key={filter.id}
                  onClick={() => toggleFilter(filter.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                    isActive
                      ? filter.activeColor
                      : `${filter.color} hover:opacity-80`
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {filter.label}
                </button>
              );
            })}
          </div>
        )}

        {/* Results count - only when data is ready */}
        {viewMode === 'list' && dataReady && parks.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            {tier1Count > 0 && (
              <Badge variant="default" className="text-xs bg-primary/90">
                🐕 {tier1Count} within 50 miles
              </Badge>
            )}
            {tier2Count > 0 && (
              <Badge variant="secondary" className="text-xs">
                📍 {tier2Count} in your area
              </Badge>
            )}
            {tier3Count > 0 && (
              <Badge variant="outline" className="text-xs">
                {tier3Count} more parks
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      {viewMode === 'map' ? (
        <div className="flex-1 relative">
          <ParksMap parks={allParks} loading={loading} />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {/* Location Loading / Detecting spinner - BLOCKS park rendering */}
          {(locationLoading || (loading && !dataReady)) && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <PawPrint className="w-12 h-12 text-primary animate-bounce mb-4" />
              <Loader2 className="w-6 h-6 animate-spin mb-2" />
              <span className="text-base font-medium">Detecting Location...</span>
              <span className="text-sm mt-1">Finding dog parks near you</span>
              {(detectedCity || detectedState) && (
                <span className="text-xs text-primary mt-2 font-mono bg-primary/10 px-2 py-1 rounded">
                  Detected: {[detectedCity, detectedState].filter(Boolean).join(', ') || 'Waiting...'}
                </span>
              )}
            </div>
          )}

          {/* Location Error - show retry */}
          {locationError && !userLocation && !locationLoading && (
            <div className="p-4 pb-2">
              <div className="text-center py-8">
                <MapPinOff className="w-10 h-10 text-destructive mx-auto mb-3" />
                <p className="text-sm text-destructive mb-4">{locationError}</p>
                <Button
                  onClick={searchNearMe}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-14 text-base font-semibold shadow-lg"
                >
                  <Search className="w-5 h-5 mr-2" />
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Parks List - only when dataReady */}
          {dataReady && !locationLoading && (
            <div className="p-4 space-y-2">
              {/* Loading skeletons while parks still fetching */}
              {loading && parks.length === 0 && (
                <>
                  {[1, 2, 3, 4, 5].map(i => (
                    <ListItemSkeleton key={i} />
                  ))}
                </>
              )}

              {/* Tier 1+2 section header */}
              {(tier1Count > 0 || tier2Count > 0) && parks.length > 0 && (
                <div className="flex items-center gap-2 pb-1">
                  <span className="text-sm font-semibold text-primary">
                    {detectedState ? `Parks Near ${detectedState}` : 'Nearby'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {tier1Count > 0 && tier2Count > 0
                      ? `${tier1Count} by distance · ${tier2Count} in your region`
                      : tier1Count > 0
                        ? 'Within 50 miles'
                        : 'In your region'}
                  </span>
                </div>
              )}

              {/* Render parks with separator between nearby and "more" */}
              {parks.map((park, index) => {
                const isFirstTier3 = index === tier1Count + tier2Count && tier3Count > 0 && (tier1Count > 0 || tier2Count > 0);
                const isLocalFavorite = index < tier1Count + tier2Count;

                return (
                  <div key={park.id}>
                    {isFirstTier3 && (
                      <div className="py-4">
                        <Separator className="mb-3" />
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-muted-foreground">More Parks</span>
                          <span className="text-xs text-muted-foreground">Beyond your area</span>
                        </div>
                      </div>
                    )}
                    <ParkListItem park={park} isLocalFavorite={isLocalFavorite} />
                  </div>
                );
              })}

              {/* Show More Button - for tier 3 */}
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
              {!loading && parks.length === 0 && (
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
          )}
        </div>
      )}
      {/* Floating Suggest Button */}
      {user && (
        <Button
          onClick={() => setSuggestOpen(true)}
          className="fixed bottom-24 right-4 z-30 rounded-full h-12 px-4 shadow-lg gap-1.5 bg-success hover:bg-success/90 text-success-foreground"
        >
          <Plus className="h-5 w-5" />
          <span className="text-xs font-semibold">Add Park</span>
        </Button>
      )}

      <SuggestParkModal open={suggestOpen} onOpenChange={setSuggestOpen} />
    </div>
  );
}

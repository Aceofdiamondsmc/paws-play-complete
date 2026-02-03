import { useRef, useEffect } from 'react';
import { Loader2, Dog } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ParkCard } from './ParkCard';
import type { Park } from '@/types';

interface ParksListProps {
  parks: Park[];
  loading: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  userLocation?: { lat: number; lng: number } | null;
  onLoadMore: () => void;
}

// Skeleton loader for initial loading state
function ParkCardSkeleton() {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <Skeleton className="w-24 h-24 rounded-xl shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <div className="flex gap-2 mt-2">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      </div>
    </Card>
  );
}

export function ParksList({ 
  parks, 
  loading, 
  loadingMore, 
  hasMore, 
  userLocation,
  onLoadMore 
}: ParksListProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingMore) {
          onLoadMore();
        }
      },
      { 
        rootMargin: '200px', // Trigger 200px before reaching bottom
        threshold: 0.1 
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, onLoadMore]);

  // Initial loading state - show skeleton cards
  if (loading && parks.length === 0) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3, 4].map(i => (
          <ParkCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (!loading && parks.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Dog className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="font-medium">No parks found matching your filters</p>
        <p className="text-sm mt-1">Try removing some filters to see more parks</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 pb-4">
      {parks.map(park => (
        <ParkCard 
          key={park.id} 
          park={park} 
          userLocation={userLocation}
        />
      ))}
      
      {/* Sentinel for infinite scroll - invisible trigger element */}
      <div ref={sentinelRef} className="h-1" aria-hidden="true" />
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      )}
      
      {/* End of list message */}
      {!hasMore && parks.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-4">
          You've seen all {parks.length} parks! 🐕
        </p>
      )}
    </div>
  );
}

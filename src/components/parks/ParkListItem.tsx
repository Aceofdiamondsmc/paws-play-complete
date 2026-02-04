import { memo, useState } from 'react';
import { Star, Navigation, PawPrint, Fence, Droplets } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceMiles, openNavigation, getValidCoords } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import type { Park } from '@/types';

interface ParkListItemProps {
  park: Park;
}

/**
 * Simplified park list item for fast rendering
 * Shows: Image, Name, Distance, Rating, Navigate button
 */
export const ParkListItem = memo(function ParkListItem({ park }: ParkListItemProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const coords = getValidCoords(park.latitude, park.longitude);
  const imageUrl = park.image_url || `https://loremflickr.com/200/200/dog,park/all?lock=${park.id}`;

  const handleNavigate = () => {
    if (coords) {
      openNavigation(coords.lat, coords.lng, park.name || 'Dog Park');
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-card rounded-xl border border-border hover:border-primary/30 transition-colors">
      {/* Image */}
      {!imageError ? (
        <div className="relative w-16 h-16 shrink-0">
          {imageLoading && (
            <Skeleton className="absolute inset-0 rounded-lg" />
          )}
          <img
            src={imageUrl}
            alt={park.name || 'Dog Park'}
            className={cn(
              "w-16 h-16 object-cover rounded-lg transition-opacity duration-200",
              imageLoading ? "opacity-0" : "opacity-100"
            )}
            loading="lazy"
            onLoad={() => setImageLoading(false)}
            onError={() => {
              setImageError(true);
              setImageLoading(false);
            }}
          />
        </div>
      ) : (
        <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-base truncate">{park.name || 'Dog Park'}</h3>
        
        <div className="flex items-center gap-2 mt-0.5">
          {/* Distance - Most important */}
          {park.distance !== undefined && (
            <span className="text-sm font-medium text-primary">
              📍 {formatDistanceMiles(park.distance)}
            </span>
          )}
          
          {/* Rating */}
          {park.rating && (
            <span className="flex items-center gap-0.5 text-sm text-muted-foreground">
              <Star className="w-3.5 h-3.5 text-warning fill-warning" />
              {park.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Quick feature badges */}
        <div className="flex gap-1 mt-1.5">
          {park.is_fully_fenced && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-accent text-accent-foreground">
              <Fence className="w-2.5 h-2.5 mr-0.5" />
              Fenced
            </Badge>
          )}
          {park.has_water_station && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 bg-secondary text-secondary-foreground">
              <Droplets className="w-2.5 h-2.5 mr-0.5" />
              Water
            </Badge>
          )}
        </div>
      </div>

      {/* Navigate Button */}
      {coords && (
        <Button
          size="sm"
          onClick={handleNavigate}
          className="shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-4"
        >
          <Navigation className="w-4 h-4 mr-1" />
          Go
        </Button>
      )}
    </div>
  );
});

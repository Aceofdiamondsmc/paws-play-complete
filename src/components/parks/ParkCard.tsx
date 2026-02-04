import { memo, useMemo, useState } from 'react';
import { Star, Fence, Droplets, Dog, TreePine, Car, Dumbbell, PawPrint, Navigation } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { calculateDistance, formatDistanceMiles, openNavigation } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import type { Park } from '@/types';

interface ParkCardProps {
  park: Park;
  userLocation?: { lat: number; lng: number } | null;
}

export const ParkCard = memo(function ParkCard({ park, userLocation }: ParkCardProps) {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  // Calculate distance only when location or park changes
  const distance = useMemo(() => {
    if (!userLocation || !park.latitude || !park.longitude) return undefined;
    return calculateDistance(userLocation.lat, userLocation.lng, park.latitude, park.longitude);
  }, [userLocation, park.latitude, park.longitude]);

  const handleNavigate = () => {
    if (park.latitude && park.longitude) {
      openNavigation(park.latitude, park.longitude, park.name || 'Dog Park');
    }
  };

  // Use image_url if available, otherwise use LoremFlickr with park ID for consistent placeholder
  const imageUrl = park.image_url || `https://loremflickr.com/300/300/dog,park,nature/all?lock=${park.id}`;
  const showImage = !imageError;

  return (
    <Card className="p-4 card-playful">
      <div className="flex gap-4">
        {showImage ? (
          <div className="relative w-24 h-24 shrink-0">
            {imageLoading && (
              <Skeleton className="absolute inset-0 rounded-xl" />
            )}
            <img
              src={imageUrl}
              alt={park.name || 'Dog Park'}
              className={cn(
                "w-24 h-24 object-cover rounded-xl transition-opacity duration-200",
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
          <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
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
              <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                <Fence className="w-3 h-3 mr-1" />
                Fenced
              </Badge>
            )}
            {park.has_water_station && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800">
                <Droplets className="w-3 h-3 mr-1" />
                Water
              </Badge>
            )}
            {park.has_small_dog_area && (
              <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800">
                <Dog className="w-3 h-3 mr-1" />
                Small Dogs
              </Badge>
            )}
            {park.has_large_dog_area && (
              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800">
                <Dog className="w-3 h-3 mr-1" />
                Large Dogs
              </Badge>
            )}
            {park.has_agility_equipment && (
              <Badge variant="outline" className="text-xs bg-pink-50 text-pink-700 border-pink-200 dark:bg-pink-900/20 dark:text-pink-400 dark:border-pink-800">
                <Dumbbell className="w-3 h-3 mr-1" />
                Agility
              </Badge>
            )}
            {park.has_parking && (
              <Badge variant="outline" className="text-xs bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900/20 dark:text-slate-400 dark:border-slate-800">
                <Car className="w-3 h-3 mr-1" />
                Parking
              </Badge>
            )}
            {park.has_grass_surface && (
              <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
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
              onClick={handleNavigate}
            >
              <Navigation className="w-4 h-4 mr-1.5" />
              Navigate
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

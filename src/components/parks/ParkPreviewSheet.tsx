import { useState, useEffect } from 'react';
import { X, Star, Navigation, Sparkles, Loader2, Fence, Droplets, Dog, Dumbbell, Car, TreePine, MapPin, PawPrint } from 'lucide-react';
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceMiles, openNavigation, getValidCoords, openNavigationByAddress } from '@/lib/navigation-utils';
import { cn } from '@/lib/utils';
import type { Park } from '@/types';

interface ParkPreviewSheetProps {
  park: Park | null;
  onClose: () => void;
}

export function ParkPreviewSheet({ park, onClose }: ParkPreviewSheetProps) {
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (!park) return;
    setAiDescription(null);
    setImageError(false);
    generateDescription();
  }, [park?.id]);

  const generateDescription = async () => {
    if (!park) return;
    // Use cached gemini_summary first
    if (park.gemini_summary) {
      setAiDescription(park.gemini_summary);
      return;
    }
    setIsLoadingAi(true);
    try {
      const { data } = await supabase.functions.invoke('generate-park-description', {
        body: {
          parkName: park.name,
          address: park.address,
          isFenced: park.is_fully_fenced,
          hasWater: park.has_water_station,
          rating: park.rating,
        }
      });
      if (data?.description) setAiDescription(data.description);
    } catch {
      // silent
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleNavigate = () => {
    if (!park) return;
    const coords = getValidCoords(park.latitude, park.longitude);
    if (coords) {
      openNavigation(coords.lat, coords.lng, park.name || 'Dog Park');
    } else {
      const query = [park.name, park.city, park.state].filter(Boolean).join(' ');
      openNavigationByAddress(query);
    }
  };

  const imageUrl = park?.image_url || (park ? `https://loremflickr.com/600/300/dog,park/all?lock=${park.id}` : '');

  const features = park ? [
    { show: park.is_fully_fenced, label: 'Fenced', icon: Fence, bg: 'bg-amber-100 text-amber-700 border-amber-300' },
    { show: park.has_water_station, label: 'Water', icon: Droplets, bg: 'bg-blue-100 text-blue-700 border-blue-300' },
    { show: park.has_small_dog_area, label: 'Small Dogs', icon: Dog, bg: 'bg-pink-100 text-pink-700 border-pink-300' },
    { show: park.has_large_dog_area, label: 'Large Dogs', icon: Dog, bg: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
    { show: park.has_agility_equipment, label: 'Agility', icon: Dumbbell, bg: 'bg-orange-100 text-orange-700 border-orange-300' },
    { show: park.has_parking, label: 'Parking', icon: Car, bg: 'bg-slate-100 text-slate-700 border-slate-300' },
    { show: park.has_grass_surface, label: 'Grass', icon: TreePine, bg: 'bg-green-100 text-green-700 border-green-300' },
  ].filter(f => f.show) : [];

  return (
    <Drawer open={!!park} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerTitle className="sr-only">{park?.name || 'Park Details'}</DrawerTitle>
        <DrawerDescription className="sr-only">Details about {park?.name || 'this park'}</DrawerDescription>
        
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-3 right-3 z-10 h-8 w-8 rounded-full bg-background/80 backdrop-blur"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>

        <div className="overflow-y-auto px-4 pb-6 space-y-4">
          {/* Hero Image */}
          {park && !imageError ? (
            <div className="relative w-full h-48 rounded-xl overflow-hidden bg-muted">
              <img
                src={imageUrl}
                alt={park.name || 'Dog Park'}
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            </div>
          ) : park ? (
            <div className="w-full h-48 rounded-xl bg-primary/10 flex items-center justify-center">
              <PawPrint className="w-16 h-16 text-primary/40" />
            </div>
          ) : null}

          {/* Name & Location */}
          {park && (
            <div>
              <h2 className="text-xl font-bold">{park.name || 'Dog Park'}</h2>
              {(park.address || park.city || park.state) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {park.address || [park.city, park.state].filter(Boolean).join(', ')}
                </p>
              )}

              <div className="flex items-center gap-3 mt-2">
                {park.rating && (
                  <span className="flex items-center gap-1 text-sm font-medium">
                    <Star className="w-4 h-4 text-warning fill-warning" />
                    {park.rating.toFixed(1)}
                    {park.user_ratings_total && (
                      <span className="text-muted-foreground text-xs">({park.user_ratings_total})</span>
                    )}
                  </span>
                )}
                {park.distance !== undefined && (
                  <span className="text-sm font-medium text-primary">
                    📍 {formatDistanceMiles(park.distance)}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Feature Badges */}
          {features.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {features.map(f => {
                const Icon = f.icon;
                return (
                  <Badge key={f.label} variant="outline" className={cn("text-xs px-2 py-0.5", f.bg)}>
                    <Icon className="w-3 h-3 mr-1" />
                    {f.label}
                  </Badge>
                );
              })}
            </div>
          )}

          {/* AI Summary */}
          <div className="p-3 bg-primary/5 rounded-xl border border-primary/10">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary">AI Park Summary</span>
            </div>
            {isLoadingAi ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Fetching tail-waggin' info...</span>
              </div>
            ) : aiDescription ? (
              <p className="text-sm leading-relaxed">{aiDescription}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                A paw-some spot for your furry friend to run and play! 🐕
              </p>
            )}
          </div>

          {/* Navigate Button */}
          <Button
            onClick={handleNavigate}
            className="w-full rounded-xl h-12 text-base font-semibold"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Get Directions
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

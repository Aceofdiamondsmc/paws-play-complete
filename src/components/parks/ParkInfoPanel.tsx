import { useState, useEffect } from 'react';
import { Star, Fence, Droplets, Dog, X, Sparkles, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import type { Park } from '@/types';

interface ParkInfoPanelProps {
  park: Park;
  onClose: () => void;
}

export function ParkInfoPanel({ park, onClose }: ParkInfoPanelProps) {
  const [aiDescription, setAiDescription] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateDescription();
  }, [park.id]);

  const generateDescription = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('generate-park-description', {
        body: {
          parkName: park.name,
          address: park.address,
          isFenced: park.is_fenced,
          hasWater: park.has_water_fountain,
          rating: park.rating,
        }
      });

      if (fnError) {
        console.error('Function error:', fnError);
        setError('Could not generate description');
        return;
      }

      if (data?.description) {
        setAiDescription(data.description);
      } else if (data?.error) {
        setError(data.error);
      }
    } catch (e) {
      console.error('Error calling function:', e);
      setError('Could not generate description');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="absolute bottom-4 left-4 right-4 z-20 p-4 bg-card/95 backdrop-blur shadow-xl border-2 border-primary/20 animate-in slide-in-from-bottom-4">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-8 w-8"
        onClick={onClose}
      >
        <X className="h-4 w-4" />
      </Button>

      <div className="flex gap-4">
        {park.image_url ? (
          <img
            src={park.image_url}
            alt={park.name}
            className="w-24 h-24 object-cover rounded-xl flex-shrink-0"
          />
        ) : (
          <div className="w-24 h-24 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
            <Dog className="w-10 h-10 text-primary" />
          </div>
        )}

        <div className="flex-1 min-w-0 pr-6">
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
          </div>
        </div>
      </div>

      {/* AI Generated Description */}
      <div className="mt-4 p-3 bg-primary/5 rounded-xl border border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">AI Park Summary</span>
        </div>
        
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Fetching tail-waggin' info...</span>
          </div>
        ) : error ? (
          <p className="text-sm text-muted-foreground italic">
            A paw-some spot for your furry friend to run and play! 🐕
          </p>
        ) : aiDescription ? (
          <p className="text-sm leading-relaxed">{aiDescription}</p>
        ) : null}
      </div>
    </Card>
  );
}

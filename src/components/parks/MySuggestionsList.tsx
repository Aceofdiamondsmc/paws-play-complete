import { useEffect } from 'react';
import { useParkSuggestions, ParkSuggestion } from '@/hooks/useParkSuggestions';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, CheckCircle2, XCircle, MapPin, Droplets, Fence, ParkingCircle, Dog, TreePine, Dumbbell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

const amenityConfig = [
  { key: 'is_fully_fenced', label: 'Fenced', icon: Fence },
  { key: 'has_water_station', label: 'Water', icon: Droplets },
  { key: 'has_small_dog_area', label: 'Small Dogs', icon: Dog },
  { key: 'has_large_dog_area', label: 'Large Dogs', icon: Dog },
  { key: 'has_agility_equipment', label: 'Agility', icon: Dumbbell },
  { key: 'has_parking', label: 'Parking', icon: ParkingCircle },
  { key: 'has_grass_surface', label: 'Grass', icon: TreePine },
] as const;

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'approved':
      return (
        <Badge className="gap-1 bg-green-100 text-green-700 border-green-200 hover:bg-green-100">
          <CheckCircle2 className="w-3 h-3" />
          Live on Map!
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="w-3 h-3" />
          Not Approved
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="gap-1 bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="w-3 h-3" />
          Under Review
        </Badge>
      );
  }
}

function AmenityChips({ suggestion }: { suggestion: ParkSuggestion }) {
  const active = amenityConfig.filter(a => (suggestion as any)[a.key]);
  if (active.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-2">
      {active.map(a => (
        <span key={a.key} className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
          <a.icon className="w-2.5 h-2.5" />
          {a.label}
        </span>
      ))}
    </div>
  );
}

export function MySuggestionsList() {
  const { mySuggestions, mySuggestionsLoading, refetchMySuggestions } = useParkSuggestions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('db-my-park-suggestions')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'park_suggestions', filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newRecord = payload.new as ParkSuggestion;
          const statusLabel = newRecord.status === 'approved' ? 'approved! 🌳' : newRecord.status === 'rejected' ? 'not approved' : 'updated';
          toast({
            title: 'Suggestion Updated!',
            description: `${newRecord.name} was ${statusLabel}`,
          });
          refetchMySuggestions();
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, toast, refetchMySuggestions]);

  if (mySuggestionsLoading) {
    return (
      <div className="space-y-3 p-1">
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (mySuggestions.length === 0) {
    return (
      <div className="text-center py-10 px-4">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <MapPin className="w-8 h-8 text-muted-foreground" />
        </div>
        <p className="font-semibold text-foreground">No suggestions yet</p>
        <p className="text-sm text-muted-foreground mt-1">
          Know a great dog park? Head to the Parks page and suggest it!
        </p>
        <Button
          className="mt-4 rounded-full"
          onClick={() => navigate('/parks')}
        >
          <MapPin className="w-4 h-4 mr-1" />
          Browse Parks
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-1">
      {mySuggestions.map(suggestion => (
        <Card key={suggestion.id} className="p-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300" style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}>
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-foreground truncate">{suggestion.name}</h4>
              {(suggestion.city || suggestion.state) && (
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {[suggestion.city, suggestion.state].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
            <StatusBadge status={suggestion.status} />
          </div>

          <AmenityChips suggestion={suggestion} />

          <p className="text-xs text-muted-foreground mt-2">
            Submitted {formatDistanceToNow(new Date(suggestion.created_at), { addSuffix: true })}
          </p>

          {suggestion.status === 'rejected' && suggestion.admin_notes && (
            <div className="mt-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/10">
              <p className="text-xs text-destructive/80">
                <span className="font-medium">Feedback:</span> {suggestion.admin_notes}
              </p>
            </div>
          )}

          {suggestion.status === 'approved' && (
            <p className="text-xs text-green-600 mt-2 font-medium">
              🌳 Your park is now visible to all users!
            </p>
          )}
        </Card>
      ))}
    </div>
  );
}

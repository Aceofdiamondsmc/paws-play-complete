import { useState } from 'react';
import { CalendarDays, Clock, MapPin, Users, Dog } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { useGroupPlaydates, GroupPlaydate } from '@/hooks/useGroupPlaydates';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Props {
  playdate: GroupPlaydate;
}

export function GroupPlaydateCard({ playdate }: Props) {
  const { user, dogs } = useAuth();
  const { rsvp, cancelRsvp } = useGroupPlaydates();
  const [selectedDogId, setSelectedDogId] = useState<string>('');
  const [joining, setJoining] = useState(false);

  const myRsvps = playdate.rsvps?.filter(r => r.user_id === user?.id) || [];
  const myDogIds = new Set(myRsvps.map(r => r.dog_id));
  const availableDogs = dogs?.filter(d => !myDogIds.has(d.id)) || [];
  const isFull = (playdate.rsvp_count || 0) >= playdate.max_dogs;
  const isOrganizer = playdate.organizer_id === user?.id;

  const handleJoin = async () => {
    if (!selectedDogId) {
      toast.error('Select a dog to join');
      return;
    }
    setJoining(true);
    const { error } = await rsvp(playdate.id, selectedDogId);
    setJoining(false);
    if (error) {
      toast.error('Failed to join');
    } else {
      toast.success('You joined the group playdate!');
      setSelectedDogId('');
    }
  };

  const handleLeave = async (dogId: string) => {
    const { error } = await cancelRsvp(playdate.id, dogId);
    if (error) {
      toast.error('Failed to leave');
    } else {
      toast.success('Left the group playdate');
    }
  };

  return (
    <Card className="p-4 bg-card">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold truncate">{playdate.title}</h3>
            {isOrganizer && <Badge variant="outline" className="text-xs shrink-0">Organizer</Badge>}
          </div>

          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1.5">
            <div className="flex items-center gap-1">
              <CalendarDays className="w-3.5 h-3.5" />
              {format(new Date(playdate.scheduled_date), 'MMM d')}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {playdate.scheduled_time?.slice(0, 5)}
            </div>
          </div>

          <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{playdate.location_name}</span>
          </div>

          {playdate.description && (
            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{playdate.description}</p>
          )}
        </div>

        <Badge variant={isFull ? 'destructive' : 'secondary'} className="shrink-0">
          <Dog className="w-3 h-3 mr-1" />
          {playdate.rsvp_count || 0}/{playdate.max_dogs}
        </Badge>
      </div>

      {/* Attendee avatars */}
      {playdate.rsvps && playdate.rsvps.length > 0 && (
        <div className="flex items-center gap-2 mt-3">
          <div className="flex -space-x-2">
            {playdate.rsvps.slice(0, 6).map(r => (
              <Avatar key={r.id} className="w-8 h-8 ring-2 ring-card">
                <AvatarImage src={r.dog?.avatar_url || undefined} />
                <AvatarFallback className="text-xs bg-primary text-primary-foreground">
                  {r.dog?.name?.[0] || '🐕'}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {playdate.rsvps.length > 6 && (
            <span className="text-xs text-muted-foreground">+{playdate.rsvps.length - 6} more</span>
          )}
        </div>
      )}

      {/* My RSVPs - Leave buttons */}
      {myRsvps.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border space-y-2">
          {myRsvps.map(r => (
            <div key={r.id} className="flex items-center justify-between">
              <span className="text-sm font-medium">{r.dog?.name || 'Your dog'} is going!</span>
              <Button variant="ghost" size="sm" className="rounded-full text-destructive" onClick={() => handleLeave(r.dog_id)}>
                Leave
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Join CTA */}
      {user && !isFull && availableDogs.length > 0 && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <Select value={selectedDogId} onValueChange={setSelectedDogId}>
            <SelectTrigger className="flex-1 rounded-full">
              <SelectValue placeholder="Select your pup" />
            </SelectTrigger>
            <SelectContent>
              {availableDogs.map(dog => (
                <SelectItem key={dog.id} value={dog.id}>{dog.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleJoin} disabled={joining || !selectedDogId} className="rounded-full" size="sm">
            <Users className="w-4 h-4 mr-1" />
            Join
          </Button>
        </div>
      )}
    </Card>
  );
}

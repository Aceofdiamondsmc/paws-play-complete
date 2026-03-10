import { useState } from 'react';
import { Users, MapPin, Calendar, Clock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGroupPlaydates } from '@/hooks/useGroupPlaydates';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupPlaydateModal({ open, onOpenChange }: Props) {
  const { createGroupPlaydate } = useGroupPlaydates();
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [maxDogs, setMaxDogs] = useState(10);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !locationName || !scheduledDate || !scheduledTime) return;

    setSubmitting(true);
    const { error } = await createGroupPlaydate({
      title,
      location_name: locationName,
      scheduled_date: scheduledDate,
      scheduled_time: scheduledTime,
      max_dogs: maxDogs,
      description: description || undefined,
    });
    setSubmitting(false);

    if (error) {
      toast.error('Failed to create group playdate');
    } else {
      toast.success('Group playdate created!');
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setTitle('');
    setLocationName('');
    setScheduledDate('');
    setScheduledTime('');
    setMaxDogs(10);
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Create Group Playdate
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="gp-title">Title *</Label>
            <Input
              id="gp-title"
              placeholder="e.g., Weekend Dog Park Meetup"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="gp-location">Location *</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="gp-location"
                placeholder="e.g., Central Bark Dog Park"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gp-date">Date *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="gp-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="pl-10"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="gp-time">Time *</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="gp-time"
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="gp-max">Max Dogs</Label>
            <Input
              id="gp-max"
              type="number"
              min={2}
              max={50}
              value={maxDogs}
              onChange={(e) => setMaxDogs(parseInt(e.target.value) || 10)}
            />
          </div>

          <div>
            <Label htmlFor="gp-desc">Description</Label>
            <Textarea
              id="gp-desc"
              placeholder="Any special notes? (e.g., small dogs only, bring water bowls)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full rounded-full">
            {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Users className="w-4 h-4 mr-1" />}
            Create Group Playdate
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

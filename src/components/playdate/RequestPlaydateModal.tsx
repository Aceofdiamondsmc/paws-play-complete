import React, { useState } from 'react';
import { format } from 'date-fns';
import { CalendarDays, Clock, MapPin, Heart, Dog } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import type { Dog as DogType } from '@/types';

interface RequestPlaydateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetDog: {
    id: string;
    name: string;
    avatar_url?: string | null;
    owner_id: string;
  };
  userDogs: DogType[];
  userId: string;
  onSuccess?: () => void;
}

export function RequestPlaydateModal({
  open,
  onOpenChange,
  targetDog,
  userDogs,
  userId,
  onSuccess
}: RequestPlaydateModalProps) {
  const [selectedDog, setSelectedDog] = useState<string>(userDogs[0]?.id || '');
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [time, setTime] = useState<string>('10:00');
  const [location, setLocation] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
  ];

  const handleSubmit = async () => {
    if (!selectedDog) {
      toast.error('Please select one of your dogs');
      return;
    }
    if (!date) {
      toast.error('Please select a date');
      return;
    }
    if (!location.trim()) {
      toast.error('Please enter a location');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('playdate_requests')
        .insert({
          requester_id: userId,
          sender_dog_id: selectedDog,
          receiver_dog_id: targetDog.id,
          location_name: location.trim(),
          requested_date: format(date, 'yyyy-MM-dd'),
          requested_time: time,
          request_message: message.trim() || null,
          status: 'pending'
        });

      if (error) throw error;

      toast.success(`Playdate request sent to ${targetDog.name}'s owner!`);
      onOpenChange(false);
      onSuccess?.();
      
      // Reset form
      setDate(undefined);
      setLocation('');
      setMessage('');
    } catch (err: any) {
      console.error('Error creating playdate request:', err);
      toast.error(err.message || 'Failed to send request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            Request Playdate with {targetDog.name}
          </DialogTitle>
          <DialogDescription>
            Choose a date, time, and location for your dogs to meet!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Select Your Dog */}
          {userDogs.length > 1 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Dog className="w-4 h-4" />
                Your Dog
              </Label>
              <Select value={selectedDog} onValueChange={setSelectedDog}>
                <SelectTrigger>
                  <SelectValue placeholder="Select your dog" />
                </SelectTrigger>
                <SelectContent>
                  {userDogs.map((dog) => (
                    <SelectItem key={dog.id} value={dog.id}>
                      {dog.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Date Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Date
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Time Picker */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Time
            </Label>
            <Select value={time} onValueChange={setTime}>
              <SelectTrigger>
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent>
                {timeSlots.map((slot) => (
                  <SelectItem key={slot} value={slot}>
                    {slot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location
            </Label>
            <Input
              placeholder="e.g., Central Park Dog Run"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label>Message (optional)</Label>
            <Textarea
              placeholder="Add a friendly note..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedDog || !date || !location.trim()}
            className="w-full rounded-full"
          >
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

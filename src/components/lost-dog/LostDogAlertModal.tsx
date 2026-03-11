import { useState } from 'react';
import { AlertTriangle, MapPin, Phone, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useLostDogAlerts } from '@/hooks/useLostDogAlerts';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LostDogAlertModal({ open, onOpenChange }: Props) {
  const { dogs } = useAuth();
  const { createAlert } = useLostDogAlerts();
  const [step, setStep] = useState(0);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const selectedDog = dogs?.find(d => d.id === selectedDogId);

  const handleGeolocate = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLastSeenLocation(prev => prev || `Near ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
        setLocating(false);
      },
      () => {
        setLocating(false);
        toast.error('Could not get location');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async () => {
    if (!selectedDogId || !lastSeenLocation || !contactPhone) return;
    setSubmitting(true);

    const { error } = await createAlert({
      dog_id: selectedDogId,
      description,
      last_seen_location: lastSeenLocation,
      last_seen_lat: coords?.lat,
      last_seen_lng: coords?.lng,
      contact_phone: contactPhone,
    });

    setSubmitting(false);
    if (error) {
      toast.error('Failed to create alert');
    } else {
      toast.success('Pack Alert sent! Check the Social feed.');
      onOpenChange(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setStep(0);
    setSelectedDogId(null);
    setLastSeenLocation('');
    setDescription('');
    setContactPhone('');
    setCoords(null);
  };

  const canProceed = () => {
    if (step === 0) return !!selectedDogId;
    if (step === 1) return !!lastSeenLocation;
    if (step === 2) return !!contactPhone;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            Report Pack Alert
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex gap-1 mb-2">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full ${i <= step ? 'bg-destructive' : 'bg-muted'}`} />
          ))}
        </div>

        {/* Step 0: Select Dog */}
        {step === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Which dog is missing?</p>
            <div className="grid gap-2">
              {dogs?.map(dog => (
                <button
                  key={dog.id}
                  onClick={() => setSelectedDogId(dog.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${
                    selectedDogId === dog.id
                      ? 'border-destructive bg-destructive/5'
                      : 'border-border hover:border-destructive/50'
                  }`}
                >
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={dog.avatar_url || undefined} />
                    <AvatarFallback>{dog.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="font-bold">{dog.name}</p>
                    <p className="text-sm text-muted-foreground">{dog.breed || 'Unknown breed'}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: Location */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Where was {selectedDog?.name} last seen?</p>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="e.g., Central Park near the dog run"
                value={lastSeenLocation}
                onChange={(e) => setLastSeenLocation(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="sm" onClick={handleGeolocate} disabled={locating} className="rounded-full">
              {locating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <MapPin className="w-4 h-4 mr-1" />}
              Use my current location
            </Button>
          </div>
        )}

        {/* Step 2: Description & Contact */}
        {step === 2 && (
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Additional details</p>
              <Textarea
                placeholder="What was your dog wearing? Any distinguishing features? When were they last seen?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Contact phone number *</p>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="(555) 123-4567"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="pl-10"
                  type="tel"
                />
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Confirmation */}
        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm font-semibold">Review your alert:</p>
            <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={selectedDog?.avatar_url || undefined} />
                  <AvatarFallback>{selectedDog?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{selectedDog?.name}</p>
                  <p className="text-xs text-muted-foreground">{selectedDog?.breed}</p>
                </div>
              </div>
              <p className="text-sm"><strong>Last seen:</strong> {lastSeenLocation}</p>
              {description && <p className="text-sm"><strong>Details:</strong> {description}</p>}
              <p className="text-sm"><strong>Contact:</strong> {contactPhone}</p>
            </div>
            <p className="text-xs text-muted-foreground">
              This will create a public post on the Social feed and notify nearby users.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-2">
          {step > 0 ? (
            <Button variant="ghost" size="sm" onClick={() => setStep(s => s - 1)} className="rounded-full">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          ) : <div />}

          {step < 3 ? (
            <Button size="sm" onClick={() => setStep(s => s + 1)} disabled={!canProceed()} className="rounded-full">
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting}
              className="rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {submitting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <AlertTriangle className="w-4 h-4 mr-1" />}
              Send Alert
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

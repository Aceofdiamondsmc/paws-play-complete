import { useState } from 'react';
import { AlertTriangle, MapPin, Phone, ChevronRight, ChevronLeft, Loader2, Gift, Printer, CheckSquare, Square, PartyPopper } from 'lucide-react';
import { Browser } from '@capacitor/browser';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { useLostDogAlerts } from '@/hooks/useLostDogAlerts';
import { toast } from 'sonner';
import { generateFlyerHTML } from './FlyerTemplate';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CHECKLIST_ITEMS = [
  'Place worn clothing outside your door (scent helps them find home).',
  'Contact all animal shelters within 20 miles.',
  'Post this alert to local Nextdoor and Facebook groups.',
  'Walk a 5-block radius and talk to neighbors.',
];

export function LostDogAlertModal({ open, onOpenChange }: Props) {
  const { dogs } = useAuth();
  const { createAlert } = useLostDogAlerts();
  const [step, setStep] = useState(0);
  const [selectedDogId, setSelectedDogId] = useState<string | null>(null);
  const [lastSeenLocation, setLastSeenLocation] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [reward, setReward] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [checkedItems, setCheckedItems] = useState<boolean[]>(new Array(CHECKLIST_ITEMS.length).fill(false));

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
      reward: reward || undefined,
    });

    setSubmitting(false);
    if (error) {
      toast.error('Failed to create alert');
    } else {
      setStep(4);
    }
  };

  const toDataUrl = async (url: string): Promise<string> => {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handlePrint = async () => {
    if (!selectedDog) return;

    const alertUrl = window.location.origin + '/social';
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(alertUrl)}`;

    // Convert images to base64 so they render inside the print context
    let avatarDataUrl: string | null = selectedDog.avatar_url;
    if (avatarDataUrl) {
      try { avatarDataUrl = await toDataUrl(avatarDataUrl); } catch { /* keep original */ }
    }

    let qrDataUrl: string = qrApiUrl;
    try { qrDataUrl = await toDataUrl(qrApiUrl); } catch { /* keep original */ }

    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

    const html = generateFlyerHTML({
      dogName: selectedDog.name,
      breed: selectedDog.breed,
      avatarUrl: avatarDataUrl,
      lastSeenLocation,
      contactPhone,
      reward: reward || undefined,
      alertUrl,
      qrImageUrl: qrDataUrl,
      printOnLoad: isNative, // auto-print when opened in system browser
    });

    if (isNative) {
      // On native iOS/Android, open in system browser which supports print
      const blob = new Blob([html], { type: 'text/html' });
      const reader = new FileReader();
      reader.onloadend = async () => {
        const dataUrl = reader.result as string;
        try {
          await Browser.open({ url: dataUrl });
        } catch {
          toast.error('Could not open flyer for printing');
        }
      };
      reader.readAsDataURL(blob);
      return;
    }

    // Web: use hidden iframe, wait for images, then print
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    iframe.style.opacity = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();

    // Wait for all images to load before printing
    const waitForImages = () => {
      const images = Array.from(doc.querySelectorAll('img'));
      return Promise.all(
        images.map(img =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((resolve) => {
                img.onload = () => resolve();
                img.onerror = () => resolve();
              })
        )
      );
    };

    await waitForImages();

    // Clean up after print dialog closes
    const cleanup = () => {
      try { document.body.removeChild(iframe); } catch { /* already removed */ }
    };

    if (iframe.contentWindow) {
      iframe.contentWindow.addEventListener('afterprint', cleanup);
      iframe.contentWindow.print();
      // Fallback cleanup in case afterprint doesn't fire
      setTimeout(cleanup, 60000);
    }
  };

  const toggleChecklist = (index: number) => {
    setCheckedItems(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const resetForm = () => {
    setStep(0);
    setSelectedDogId(null);
    setLastSeenLocation('');
    setDescription('');
    setContactPhone('');
    setReward('');
    setCoords(null);
    setCheckedItems(new Array(CHECKLIST_ITEMS.length).fill(false));
  };

  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  const canProceed = () => {
    if (step === 0) return !!selectedDogId;
    if (step === 1) return !!lastSeenLocation;
    if (step === 2) return !!contactPhone;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="max-w-md">
        {step < 4 ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-5 h-5" />
                Report Lost Dog
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

            {/* Step 2: Description, Contact & Reward */}
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
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Reward (optional)</p>
                  <div className="relative">
                    <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="e.g., $200 for safe return"
                      value={reward}
                      onChange={(e) => setReward(e.target.value)}
                      className="pl-10"
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
                  {reward && <p className="text-sm"><strong>💰 Reward:</strong> {reward}</p>}
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
          </>
        ) : (
          /* Step 4: Success */
          <div className="space-y-4">
            <div className="text-center">
              <PartyPopper className="w-12 h-12 mx-auto text-primary mb-2" />
              <h2 className="text-xl font-extrabold text-foreground">Pack Alert Broadcasted!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                The community has been notified. While the Pack keeps a lookout, here are your immediate next steps:
              </p>
            </div>

            <div className="space-y-2">
              {CHECKLIST_ITEMS.map((item, i) => (
                <button
                  key={i}
                  onClick={() => toggleChecklist(i)}
                  className="flex items-start gap-3 w-full text-left p-2.5 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  {checkedItems[i] ? (
                    <CheckSquare className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Square className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                  )}
                  <span className={`text-sm ${checkedItems[i] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                    {item}
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={handlePrint} className="rounded-full w-full">
                <Printer className="w-4 h-4 mr-2" />
                Download / Print Flyer
              </Button>
              <Button size="sm" onClick={handleClose} className="rounded-full w-full">
                Got it, let's find {selectedDog?.name}!
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

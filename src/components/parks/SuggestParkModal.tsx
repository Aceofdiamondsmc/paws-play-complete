import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { CountryCombobox } from '@/components/ui/country-combobox';
import { Loader2 } from 'lucide-react';
import { useParkSuggestions, type ParkSuggestionInput } from '@/hooks/useParkSuggestions';
import { useToast } from '@/hooks/use-toast';
import { ConfettiBurst } from '@/components/dates/ConfettiBurst';
import { detectDefaultCountry, isUSCountry } from '@/lib/countries';

interface SuggestParkModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const buildInitialForm = (): ParkSuggestionInput => ({
  name: '',
  address: '',
  city: '',
  state: '',
  zip_code: '',
  country: detectDefaultCountry(),
  description: '',
  is_fully_fenced: false,
  has_water_station: false,
  has_small_dog_area: false,
  has_large_dog_area: false,
  has_agility_equipment: false,
  has_parking: false,
  has_grass_surface: false,
});

export function SuggestParkModal({ open, onOpenChange }: SuggestParkModalProps) {
  const [form, setForm] = useState<ParkSuggestionInput>(buildInitialForm);
  const [submitting, setSubmitting] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const { submitSuggestion, refetchMySuggestions } = useParkSuggestions();
  const { toast } = useToast();

  const update = <K extends keyof ParkSuggestionInput>(key: K, val: ParkSuggestionInput[K]) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast({ title: 'Name required', description: 'Please enter the park name.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const { error } = await submitSuggestion(form);
    setSubmitting(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setShowConfetti(true);
      toast({ title: 'Suggestion submitted!', description: 'Thanks! Your suggestion is under review.' });
      refetchMySuggestions();
      setTimeout(() => {
        setShowConfetti(false);
        setForm(buildInitialForm());
        onOpenChange(false);
      }, 1200);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Suggest a Dog Park</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="suggest-name">Park Name *</Label>
            <Input id="suggest-name" value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Bark Park" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="suggest-country">Country</Label>
            <CountryCombobox
              id="suggest-country"
              value={form.country || ''}
              onChange={(v) => update('country', v)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="suggest-address">Address</Label>
            <Input id="suggest-address" value={form.address} onChange={e => update('address', e.target.value)} placeholder="Street address" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="suggest-city">City</Label>
              <Input id="suggest-city" value={form.city} onChange={e => update('city', e.target.value)} placeholder={isUSCountry(form.country) ? 'Las Vegas' : 'Fort-de-France'} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="suggest-state">{isUSCountry(form.country) ? 'State' : 'Region'}</Label>
              <Input id="suggest-state" value={form.state} onChange={e => update('state', e.target.value)} placeholder={isUSCountry(form.country) ? 'NV' : 'Martinique'} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="suggest-zip">{isUSCountry(form.country) ? 'ZIP Code' : 'Postal Code'}</Label>
              <Input id="suggest-zip" value={form.zip_code} onChange={e => update('zip_code', e.target.value)} placeholder={isUSCountry(form.country) ? 'ZIP' : '97250'} maxLength={10} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="suggest-desc">Description</Label>
            <Textarea id="suggest-desc" value={form.description} onChange={e => update('description', e.target.value)} placeholder="Tell us about this park..." rows={3} />
          </div>

          <div className="space-y-3">
            <Label>Amenities</Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'is_fully_fenced' as const, label: 'Fully Fenced' },
                { key: 'has_water_station' as const, label: 'Water Station' },
                { key: 'has_small_dog_area' as const, label: 'Small Dog Area' },
                { key: 'has_large_dog_area' as const, label: 'Large Dog Area' },
                { key: 'has_agility_equipment' as const, label: 'Agility Equipment' },
                { key: 'has_parking' as const, label: 'Parking' },
                { key: 'has_grass_surface' as const, label: 'Grass Surface' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor={`suggest-${key}`} className="cursor-pointer text-sm">{label}</Label>
                  <Switch id={`suggest-${key}`} checked={!!form[key]} onCheckedChange={v => update(key, v)} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {showConfetti && (
          <div className="relative flex justify-center py-2">
            <ConfettiBurst />
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Submit Suggestion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

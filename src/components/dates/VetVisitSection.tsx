import { useState } from 'react';
import { format } from 'date-fns';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Stethoscope, CalendarIcon, ChevronDown, Plus, Trash2, Dog, Syringe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { useVetVisits, type LogVetVisitData } from '@/hooks/useVetVisits';
import { toast } from 'sonner';

const VISIT_TYPES = [
  { value: 'annual_checkup', label: 'Annual Checkup' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'sick_visit', label: 'Sick Visit' },
  { value: 'dental', label: 'Dental' },
  { value: 'surgery', label: 'Surgery' },
  { value: 'other', label: 'Other' },
];

const COMMON_VACCINATIONS = [
  'Rabies',
  'DHPP',
  'Bordetella',
  'Leptospirosis',
  'Canine Influenza',
  'Lyme',
];

export function VetVisitSection() {
  const { user, dogs } = useAuth();
  const { visits, loading, logVisit, deleteVisit } = useVetVisits();
  const [isOpen, setIsOpen] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [selectedDogId, setSelectedDogId] = useState('');
  const [visitDate, setVisitDate] = useState<Date>();
  const [clinicName, setClinicName] = useState('');
  const [visitType, setVisitType] = useState('annual_checkup');
  const [selectedVaccinations, setSelectedVaccinations] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  const [yearlyReminder, setYearlyReminder] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!user) return null;

  const toggleVaccination = (vacc: string) => {
    setSelectedVaccinations(prev =>
      prev.includes(vacc) ? prev.filter(v => v !== vacc) : [...prev, vacc]
    );
  };

  const resetForm = () => {
    setSelectedDogId('');
    setVisitDate(undefined);
    setClinicName('');
    setVisitType('annual_checkup');
    setSelectedVaccinations([]);
    setNotes('');
    setYearlyReminder(false);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!selectedDogId) { toast.error('Please select a dog'); return; }
    if (!visitDate) { toast.error('Please select a visit date'); return; }

    setSaving(true);
    const data: LogVetVisitData = {
      dog_id: selectedDogId,
      visit_date: format(visitDate, 'yyyy-MM-dd'),
      clinic_name: clinicName || undefined,
      visit_type: visitType,
      vaccination_types: selectedVaccinations.length > 0 ? selectedVaccinations : undefined,
      notes: notes || undefined,
      create_yearly_reminder: yearlyReminder,
    };

    const { error } = await logVisit(data);
    if (error) {
      toast.error('Failed to log vet visit');
    } else {
      toast.success(
        selectedVaccinations.length > 0
          ? 'Vet visit logged & vaccination records updated!'
          : 'Vet visit logged!'
      );
      resetForm();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteVisit(id);
    if (error) {
      toast.error('Failed to delete visit');
    } else {
      toast.success('Visit removed');
    }
  };

  const getDogName = (dogId: string) => {
    const dog = dogs?.find(d => d.id === dogId);
    return dog?.name || 'Unknown';
  };

  const getDogAvatar = (dogId: string) => {
    const dog = dogs?.find(d => d.id === dogId);
    return dog?.avatar_url || null;
  };

  const getVisitTypeLabel = (value: string) =>
    VISIT_TYPES.find(v => v.value === value)?.label || value;

  return (
    <Card className="p-5 bg-card mt-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button className="flex items-center gap-3 w-full bg-primary/10 rounded-xl p-4 -mx-1">
            <Stethoscope className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-primary flex-1 text-left">Vet Visit Log</h2>
            <ChevronDown className={cn("w-5 h-5 text-primary transition-transform", isOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Add Visit Button */}
          {!showForm && (
            <Button
              variant="outline"
              className="w-full rounded-full border-dashed"
              onClick={() => setShowForm(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Log Vet Visit
            </Button>
          )}

          {/* Form */}
          {showForm && (
            <div className="space-y-4 p-4 rounded-xl bg-muted/50 border border-border">
              {/* Dog Selector */}
              <div className="space-y-2">
                <Label>Dog</Label>
                <Select value={selectedDogId} onValueChange={setSelectedDogId}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue placeholder="Select a dog" />
                  </SelectTrigger>
                  <SelectContent>
                    {(dogs || []).map(dog => (
                      <SelectItem key={dog.id} value={dog.id}>
                        <div className="flex items-center gap-2">
                          <Dog className="w-4 h-4" />
                          {dog.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Visit Date */}
              <div className="space-y-2">
                <Label>Visit Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-full",
                        !visitDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {visitDate ? format(visitDate, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={visitDate}
                      onSelect={setVisitDate}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Clinic Name */}
              <div className="space-y-2">
                <Label>Clinic Name (optional)</Label>
                <Input
                  placeholder="e.g., PetVet Clinic"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  className="rounded-full"
                />
              </div>

              {/* Visit Type */}
              <div className="space-y-2">
                <Label>Visit Type</Label>
                <Select value={visitType} onValueChange={setVisitType}>
                  <SelectTrigger className="rounded-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VISIT_TYPES.map(vt => (
                      <SelectItem key={vt.value} value={vt.value}>{vt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Vaccinations */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Syringe className="w-4 h-4 text-primary" />
                  Vaccinations Given
                </Label>
                <p className="text-xs text-muted-foreground">
                  Selected vaccines will auto-update your dog's vaccination records (+1 year expiry)
                </p>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {COMMON_VACCINATIONS.map(vacc => (
                    <label
                      key={vacc}
                      className={cn(
                        "flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-colors text-sm",
                        selectedVaccinations.includes(vacc)
                          ? "bg-primary/10 border-primary"
                          : "bg-background border-border hover:bg-muted"
                      )}
                    >
                      <Checkbox
                        checked={selectedVaccinations.includes(vacc)}
                        onCheckedChange={() => toggleVaccination(vacc)}
                      />
                      {vacc}
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Any notes about the visit..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {/* Yearly Reminder Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border border-border">
                <div>
                  <p className="text-sm font-medium">Repeat Yearly</p>
                  <p className="text-xs text-muted-foreground">Get reminded on this date every year</p>
                </div>
                <Switch checked={yearlyReminder} onCheckedChange={setYearlyReminder} />
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 rounded-full" onClick={handleSubmit} disabled={saving}>
                  {saving ? 'Saving...' : 'Log Visit'}
                </Button>
                <Button variant="outline" className="rounded-full" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Visit History */}
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="animate-spin w-6 h-6 border-3 border-primary border-t-transparent rounded-full" />
            </div>
          ) : visits.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Stethoscope className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No vet visits logged yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-muted-foreground">Visit History</h3>
              {visits.map(visit => (
                <div
                  key={visit.id}
                  className="flex items-start gap-3 p-3 rounded-xl bg-background border border-border"
                >
                  <Avatar className="w-9 h-9 mt-0.5">
                    <AvatarImage src={getDogAvatar(visit.dog_id) || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getDogName(visit.dog_id).charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{getDogName(visit.dog_id)}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(visit.visit_date), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">
                      {getVisitTypeLabel(visit.visit_type)}
                      {visit.clinic_name && <span className="text-muted-foreground"> at {visit.clinic_name}</span>}
                    </p>
                    {visit.vaccination_types && visit.vaccination_types.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {visit.vaccination_types.map(v => (
                          <span key={v} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                            <Syringe className="w-3 h-3" />
                            {v}
                          </span>
                        ))}
                      </div>
                    )}
                    {visit.notes && (
                      <p className="text-xs text-muted-foreground mt-1">{visit.notes}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    onClick={() => handleDelete(visit.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

import React, { useState, useRef, useEffect } from 'react';
import { Camera, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDogs } from '@/hooks/useDogs';
import { useCareNotificationContext } from '@/components/CareNotificationProvider';
import { toast } from 'sonner';
import { BreedCombobox } from './BreedCombobox';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

// Play style options stored directly (no separate table)
const PLAY_STYLE_OPTIONS = [
  'Fetch',
  'Tug-of-war',
  'Chase',
  'Wrestling',
  'Swimming',
  'Running',
  'Cuddling',
  'Independent',
];

interface PackMemberFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  editingDog?: {
    id: string;
    name: string;
    breed?: string | null;
    size?: string | null;
    energy_level?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    age_years?: number | null;
    weight_lbs?: number | null;
    health_notes?: string | null;
    play_style?: string[] | null;
    vaccination_certified?: boolean | null;
    date_of_birth?: string | null;
  };
}

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large'];
const ENERGY_OPTIONS = ['Low', 'Medium', 'High', 'Very High'];

export function PackMemberForm({ open, onClose, onSuccess, editingDog }: PackMemberFormProps) {
  const { addDog, updateDog, uploadDogAvatar } = useDogs();
  const { user } = useAuth();
  const { addReminder } = useCareNotificationContext();
  
  const [name, setName] = useState(editingDog?.name || '');
  const [breed, setBreed] = useState(editingDog?.breed || '');
  const [size, setSize] = useState(editingDog?.size || 'Medium');
  const [energy, setEnergy] = useState(editingDog?.energy_level || 'Medium');
  const [bio, setBio] = useState(editingDog?.bio || '');
  const [ageYears, setAgeYears] = useState(editingDog?.age_years?.toString() || '');
  const [weightLbs, setWeightLbs] = useState(editingDog?.weight_lbs?.toString() || '');
  const [healthInfo, setHealthInfo] = useState(editingDog?.health_notes || '');
  const [avatarUrl, setAvatarUrl] = useState(editingDog?.avatar_url || '');
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>(
    editingDog?.play_style || []
  );
  const [vaccinationCertified, setVaccinationCertified] = useState(editingDog?.vaccination_certified ?? false);
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(
    editingDog?.date_of_birth ? new Date(editingDog.date_of_birth + 'T00:00:00') : undefined
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset form when editingDog changes
  useEffect(() => {
    setName(editingDog?.name || '');
    setBreed(editingDog?.breed || '');
    setSize(editingDog?.size || 'Medium');
    setEnergy(editingDog?.energy_level || 'Medium');
    setBio(editingDog?.bio || '');
    setAgeYears(editingDog?.age_years?.toString() || '');
    setWeightLbs(editingDog?.weight_lbs?.toString() || '');
    setHealthInfo(editingDog?.health_notes || '');
    setAvatarUrl(editingDog?.avatar_url || '');
    setSelectedPlayStyles(editingDog?.play_style || []);
    setVaccinationCertified(editingDog?.vaccination_certified ?? false);
    setDateOfBirth(editingDog?.date_of_birth ? new Date(editingDog.date_of_birth + 'T00:00:00') : undefined);
    setErrors({});
    setTouched({});
  }, [editingDog]);

  const validateName = (value: string) => {
    if (!value.trim()) return 'Name is required';
    if (value.trim().length < 2) return 'Name must be at least 2 characters';
    if (value.trim().length > 50) return 'Name must be less than 50 characters';
    return undefined;
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (editingDog?.id) {
      setIsUploading(true);
      const { url, error } = await uploadDogAvatar(editingDog.id, file);
      setIsUploading(false);
      
      if (error) {
        toast.error('Failed to upload photo');
      } else if (url) {
        setAvatarUrl(url);
        toast.success('Photo updated!');
      }
    } else {
      // For new dogs, show preview but upload after creation
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const togglePlayStyle = (styleId: string) => {
    setSelectedPlayStyles(prev => 
      prev.includes(styleId) 
        ? prev.filter(id => id !== styleId)
        : [...prev, styleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields
    const nameError = validateName(name);
    setErrors({ name: nameError });
    setTouched({ name: true });
    
    if (nameError) {
      toast.error(nameError);
      return;
    }

    setIsSubmitting(true);

    try {
      const dogData = {
        name: name.trim(),
        breed: breed.trim(),
        size,
        energy_level: energy,
        bio: bio.trim(),
        age_years: ageYears ? parseInt(ageYears) : undefined,
        weight_lbs: weightLbs ? parseFloat(weightLbs) : undefined,
        health_notes: healthInfo.trim(),
        play_style: selectedPlayStyles,
        vaccination_certified: vaccinationCertified,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : undefined,
      };

      if (editingDog) {
        const { error } = await updateDog(editingDog.id, dogData);
        if (error) throw error;
        toast.success('Pack member updated!');
      } else {
        const { dog, error } = await addDog(dogData);
        if (error) throw error;

        if (dog && avatarUrl && avatarUrl.startsWith('data:')) {
          // Convert base64 to file and upload
          const response = await fetch(avatarUrl);
          const blob = await response.blob();
          const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
          await uploadDogAvatar(dog.id, file);
        }
        
        toast.success('Pack member added!');
      }

      onSuccess?.();
      onClose();
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      const errorMessage = err?.message || err?.code || 'Unknown error';
      toast.error(`Failed to save: ${errorMessage}`);
      console.error('Dog save error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {editingDog ? 'Edit Pack Member' : 'Add Pack Member'}
          </DialogTitle>
          <DialogDescription>
            {editingDog ? 'Update your pet\'s information below.' : 'Add your furry friend to your pack by filling out the details below.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {name?.[0]?.toUpperCase() || '🐕'}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
              >
                {isUploading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (touched.name) {
                    setErrors(prev => ({ ...prev, name: validateName(e.target.value) }));
                  }
                }}
                onBlur={() => {
                  setTouched(prev => ({ ...prev, name: true }));
                  setErrors(prev => ({ ...prev, name: validateName(name) }));
                }}
                placeholder="Your pup's name"
                className={`mt-1 ${touched.name && errors.name ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                aria-invalid={touched.name && !!errors.name}
                aria-describedby={errors.name ? 'name-error' : undefined}
              />
              {touched.name && errors.name && (
                <p id="name-error" className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="breed">Breed</Label>
              <BreedCombobox value={breed} onValueChange={setBreed} />
            </div>

            <div>
              <Label htmlFor="age">Age (years)</Label>
              <Input
                id="age"
                type="number"
                min="0"
                max="30"
                value={ageYears}
                onChange={(e) => setAgeYears(e.target.value)}
                placeholder="e.g., 3"
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label>Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateOfBirth ? format(dateOfBirth, 'PPP') : <span>Pick a date (optional)</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                min="0"
                max="300"
                value={weightLbs}
                onChange={(e) => setWeightLbs(e.target.value)}
                placeholder="e.g., 45"
                className="mt-1"
              />
            </div>

            <div>
              <Label>Size</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label>Energy Level</Label>
              <Select value={energy} onValueChange={setEnergy}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENERGY_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Play Styles */}
          <div>
            <Label className="mb-2 block">Play Style</Label>
            <div className="flex flex-wrap gap-2">
              {PLAY_STYLE_OPTIONS.map(style => (
                <button
                  key={style}
                  type="button"
                  onClick={() => togglePlayStyle(style)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedPlayStyles.includes(style)
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about your pup's personality..."
              className="mt-1"
              rows={3}
            />
          </div>

          {/* Health Info */}
          <div>
            <Label htmlFor="health">Health Notes</Label>
            <Textarea
              id="health"
              value={healthInfo}
              onChange={(e) => setHealthInfo(e.target.value)}
              placeholder="Any allergies, conditions, or special needs..."
              className="mt-1"
              rows={2}
            />
          </div>

          {/* Vaccination Certification */}
          <div className="flex items-start gap-3 rounded-xl border border-border p-4 bg-muted/30">
            <Switch
              id="vaccination-certified"
              checked={vaccinationCertified}
              onCheckedChange={setVaccinationCertified}
              className="mt-0.5"
            />
            <Label htmlFor="vaccination-certified" className="text-sm leading-relaxed cursor-pointer">
              I certify that <strong>{name.trim() || 'my dog'}</strong> is up-to-date on all local vaccination requirements (Rabies, DHPP, etc.)
            </Label>
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : editingDog ? 'Save Changes' : 'Add to Pack'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { toast } from 'sonner';
import { BreedCombobox } from './BreedCombobox';

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
    energy?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    age_years?: number | null;
    weight_lbs?: number | null;
    health_notes?: string | null;
  };
}

const SIZE_OPTIONS = ['Small', 'Medium', 'Large', 'Extra Large'];
const ENERGY_OPTIONS = ['Low', 'Medium', 'High', 'Very High'];

export function PackMemberForm({ open, onClose, onSuccess, editingDog }: PackMemberFormProps) {
  const { addDog, updateDog, uploadDogAvatar } = useDogs();
  const { user } = useAuth();
  
  const [name, setName] = useState(editingDog?.name || '');
  const [breed, setBreed] = useState(editingDog?.breed || '');
  const [size, setSize] = useState(editingDog?.size || 'Medium');
  const [energy, setEnergy] = useState(editingDog?.energy || 'Medium');
  const [bio, setBio] = useState(editingDog?.bio || '');
  const [ageYears, setAgeYears] = useState(editingDog?.age_years?.toString() || '');
  const [weightLbs, setWeightLbs] = useState(editingDog?.weight_lbs?.toString() || '');
  const [healthInfo, setHealthInfo] = useState(editingDog?.health_notes || '');
  const [avatarUrl, setAvatarUrl] = useState(editingDog?.avatar_url || '');
  const [selectedPlayStyles, setSelectedPlayStyles] = useState<string[]>(
    (editingDog as { play_style?: string[] | null })?.play_style || []
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean }>({});
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        energy,
        energy_level: energy,
        bio: bio.trim(),
        age_years: ageYears ? parseInt(ageYears) : undefined,
        weight_lbs: weightLbs ? parseFloat(weightLbs) : undefined,
        health_notes: healthInfo.trim(),
        play_style: selectedPlayStyles
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
    } catch (error) {
      toast.error('Something went wrong');
      console.error(error);
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

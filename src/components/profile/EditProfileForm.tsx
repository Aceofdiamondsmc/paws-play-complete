import React, { useState, useRef } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useProfile } from '@/hooks/useProfileManagement';
import { toast } from 'sonner';

interface EditProfileFormProps {
  open: boolean;
  onClose: () => void;
  profile: {
    display_name?: string | null;
    username?: string | null;
    bio?: string | null;
    city?: string | null;
    state?: string | null;
    avatar_url?: string | null;
    location_public?: boolean;
  } | null;
}

export function EditProfileForm({ open, onClose, profile }: EditProfileFormProps) {
  const { updateProfile, uploadAvatar } = useProfile();
  
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const [locationPublic, setLocationPublic] = useState(profile?.location_public !== false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const { url, error } = await uploadAvatar(file);
    setIsUploading(false);
    
    if (error) {
      toast.error('Failed to upload photo');
    } else if (url) {
      setAvatarUrl(url);
      toast.success('Photo updated!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { error } = await updateProfile({
        display_name: displayName.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        location_public: locationPublic
      });

      if (error) throw error;

      toast.success('Profile updated!');
      onClose();
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="w-24 h-24 ring-4 ring-primary/20">
                <AvatarImage src={avatarUrl || undefined} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                  {displayName?.[0]?.toUpperCase() || '?'}
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

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="mt-1"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="@username"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g., Austin"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
                placeholder="e.g., TX"
                className="mt-1"
              />
            </div>

            <div className="col-span-2 flex items-center justify-between py-1">
              <Label htmlFor="locationPublic" className="text-sm cursor-pointer">
                Show my city/state publicly
              </Label>
              <Switch
                id="locationPublic"
                checked={locationPublic}
                onCheckedChange={setLocationPublic}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself..."
                className="mt-1"
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

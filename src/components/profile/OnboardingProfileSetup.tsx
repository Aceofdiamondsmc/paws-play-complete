import React, { useRef, useState } from 'react';
import { Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useProfile } from '@/hooks/useProfileManagement';
import type { Profile } from '@/types';
import type { User } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface OnboardingProfileSetupProps {
  profile: Profile | null;
  user: User | null;
  onNext: () => void;
}

export function OnboardingProfileSetup({ profile, user, onNext }: OnboardingProfileSetupProps) {
  const { updateProfile, uploadAvatar } = useProfile();

  // Pre-fill from Apple Sign-In metadata if available
  const appleProvidedName = user?.user_metadata?.full_name || user?.user_metadata?.name || '';
  const [displayName, setDisplayName] = useState(profile?.display_name || appleProvidedName || '');
  const [username, setUsername] = useState(profile?.username || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [city, setCity] = useState(profile?.city || '');
  const [state, setState] = useState(profile?.state || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

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
      toast.error(error.message || 'Failed to upload photo');
      return;
    }

    if (url) {
      setAvatarUrl(url);
      toast.success('Photo updated!');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!displayName.trim()) {
      toast.error('Please enter your display name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updateProfile({
        display_name: displayName.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
      });

      if (error) throw error;

      onNext();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save profile';
      toast.error(message);
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto px-4">
      {/* Avatar Upload */}
      <div className="flex justify-center">
        <div className="relative">
          <Avatar className="w-28 h-28 ring-4 ring-primary/20">
            <AvatarImage src={avatarUrl || undefined} />
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
              {(displayName?.[0] || '?').toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute -bottom-1 -right-1 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors"
          >
            {isUploading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            ) : (
              <Camera className="w-5 h-5" />
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

      <div className="mt-8 space-y-4">
        <div>
          <Label htmlFor="displayName">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your name"
            className="mt-1 rounded-xl h-12"
            autoFocus
          />
        </div>

        <div>
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="@username"
            className="mt-1 rounded-xl h-12"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g., Las Vegas"
              className="mt-1 rounded-xl h-12"
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={state}
              onChange={(e) => setState(e.target.value)}
              placeholder="e.g., NV"
              className="mt-1 rounded-xl h-12"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself…"
            className="mt-1 rounded-xl"
            rows={4}
          />
        </div>

        <div className="pt-2">
          <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl h-12">
            {isSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </form>
  );
}

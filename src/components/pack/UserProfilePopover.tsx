import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MessageSquare, PawPrint, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfilePopoverProps {
  userId: string;
  children: React.ReactNode;
  onMessage?: () => void;
}

interface MiniProfile {
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  city: string | null;
  state: string | null;
}

export function UserProfilePopover({ userId, children, onMessage }: UserProfilePopoverProps) {
  const [profile, setProfile] = useState<MiniProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchProfile = async () => {
    if (profile) return;
    setLoading(true);
    const { data } = await supabase
      .from('public_profiles')
      .select('display_name, avatar_url, bio, city, state')
      .eq('id', userId)
      .maybeSingle();
    if (data) setProfile(data as MiniProfile);
    setLoading(false);
  };

  return (
    <Popover open={open} onOpenChange={(v) => { setOpen(v); if (v) fetchProfile(); }}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-64 bg-card border-border shadow-xl rounded-xl p-4 z-[200]"
      >
        {loading ? (
          <div className="flex items-center gap-3 animate-pulse">
            <div className="w-10 h-10 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-muted rounded w-24" />
              <div className="h-2 bg-muted rounded w-16" />
            </div>
          </div>
        ) : profile ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10 border border-border">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-muted">
                  <PawPrint className="w-5 h-5 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-foreground truncate">
                  {profile.display_name || 'Dog Parent'}
                </p>
                {(profile.city || profile.state) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[profile.city, profile.state].filter(Boolean).join(', ')}
                  </p>
                )}
              </div>
            </div>
            {profile.bio && (
              <p className="text-xs text-muted-foreground line-clamp-3">{profile.bio}</p>
            )}
            {onMessage && (
              <Button
                size="sm"
                variant="outline"
                className="w-full h-8 text-xs"
                onClick={() => { setOpen(false); onMessage(); }}
              >
                <MessageSquare className="w-3.5 h-3.5 mr-1.5" />
                Message
              </Button>
            )}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Profile not available</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

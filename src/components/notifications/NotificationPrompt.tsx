import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void>>;
  }
}

export function NotificationPrompt() {
  const { user, profile } = useAuth();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only show prompt for logged-in users who haven't set up notifications yet
    if (user && profile && !profile.onesignal_player_id) {
      // Small delay to not show immediately on login
      const timer = setTimeout(() => {
        setVisible(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  const handleEnableNotifications = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Request notification permission via OneSignal
      if (window.OneSignalDeferred) {
      window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            // Request permission
            await OneSignal.Notifications.requestPermission();
            
            // CRITICAL: Login with Supabase user ID so Edge Functions can target by UUID
            await OneSignal.login(user.id);
            console.log('OneSignal login called with Supabase user ID:', user.id);
            
            // Get the Player ID (Subscription ID in v16+)
            const playerId = await OneSignal.User.PushSubscription.id;
            
            if (playerId) {
              // Save to Supabase profile
              const { error } = await supabase
                .from('profiles')
                .update({ 
                  onesignal_player_id: playerId,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

              if (error) {
                console.error('Error saving player ID:', error);
                toast.error('Failed to save notification settings');
              } else {
                toast.success('Notifications enabled! 🔔');
                setVisible(false);
              }
            } else {
              toast.info('Notifications declined');
              setVisible(false);
            }
          } catch (err) {
            console.error('OneSignal error:', err);
            toast.error('Could not enable notifications');
          } finally {
            setLoading(false);
          }
        });
      } else {
        toast.error('Notification service unavailable');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      toast.error('Failed to enable notifications');
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <Card className="p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm">Stay in the loop! 🐾</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get notified when someone likes or comments on your posts.
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                className="rounded-full text-xs h-8"
                onClick={handleEnableNotifications}
                disabled={loading}
              >
                {loading ? 'Enabling...' : 'Enable Notifications'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="rounded-full text-xs h-8"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </Card>
    </div>
  );
}

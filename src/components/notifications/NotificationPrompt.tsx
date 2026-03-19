import React, { useState, useEffect, useContext } from 'react';
import { Bell, X, Share } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AuthContext } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isIOS, isStandalone } from '@/lib/navigation-utils';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void>>;
  }
}

const isNativePlatform = () => !!(window as any).Capacitor?.isNativePlatform?.();

export function NotificationPrompt() {
  const context = useContext(AuthContext);
  const user = context?.user ?? null;
  const profile = context?.profile ?? null;
  const [promptType, setPromptType] = useState<'standard' | 'ios-install' | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !profile) return;

    // On native, check actual push permission status instead of onesignal_player_id
    if (isNativePlatform()) {
      (async () => {
        try {
          const { PushNotifications } = await import('@capacitor/push-notifications');
          const result = await PushNotifications.checkPermissions();
          if (result.receive !== 'granted') {
            const timer = setTimeout(() => setPromptType('standard'), 3000);
            return () => clearTimeout(timer);
          }
        } catch (e) {
          console.warn('Could not check native push permissions:', e);
        }
      })();
      return;
    }

    // Web: only show if no onesignal_player_id
    if (!profile.onesignal_player_id) {
      const dismissed = localStorage.getItem('ios-install-prompt-dismissed');
      const dismissedAt = dismissed ? parseInt(dismissed, 10) : 0;
      const sevenDays = 7 * 24 * 60 * 60 * 1000;

      if (isIOS() && !isStandalone()) {
        if (Date.now() - dismissedAt > sevenDays) {
          const timer = setTimeout(() => setPromptType('ios-install'), 3000);
          return () => clearTimeout(timer);
        }
      } else {
        const timer = setTimeout(() => setPromptType('standard'), 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [user, profile]);

  const handleEnableNotifications = async () => {
    if (!user) return;

    setLoading(true);

    const timeoutId = setTimeout(() => {
      setLoading(false);
      toast.error('Request timed out. Please try again.');
    }, 30000);

    try {
      if (isNativePlatform()) {
        const { PushNotifications } = await import('@capacitor/push-notifications');
        await PushNotifications.removeAllListeners();
        const permResult = await PushNotifications.requestPermissions();
        
        if (permResult.receive === 'granted') {
          await PushNotifications.register();

          await PushNotifications.addListener('registration', async (token) => {
            try {
              const { error: fnError } = await supabase.functions.invoke('register-push-token', {
                body: { token: token.value, device_type: 'ios' },
              });

              if (fnError) {
                await supabase.from('profiles').update({ 
                  onesignal_player_id: token.value,
                  updated_at: new Date().toISOString() 
                }).eq('id', user.id);
              }

              clearTimeout(timeoutId);
              setLoading(false);
              toast.success('Notifications enabled! 🔔');
              setPromptType(null);
            } catch (err) {
              console.error('Registration error:', err);
              clearTimeout(timeoutId);
              setLoading(false);
            }
          });

          await PushNotifications.addListener('registrationError', (err) => {
            console.error('Push registration error:', err);
            clearTimeout(timeoutId);
            setLoading(false);
            toast.error('Could not enable notifications');
          });
        } else {
          clearTimeout(timeoutId);
          setLoading(false);
          toast.info('Notifications declined');
          setPromptType(null);
        }
      } else if (window.OneSignalDeferred) {
        window.OneSignalDeferred.push(async (OneSignal: any) => {
          try {
            await OneSignal.Notifications.requestPermission();
            await OneSignal.login(user.id);
            const playerId = await OneSignal.User.PushSubscription.id;

            if (playerId) {
              await supabase
                .from('profiles')
                .update({
                  onesignal_player_id: playerId,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', user.id);
              
              toast.success('Notifications enabled! 🔔');
              setPromptType(null);
            } else {
              toast.info('Notifications declined');
              setPromptType(null);
            }
          } catch (err) {
            console.error('OneSignal error:', err);
          } finally {
            clearTimeout(timeoutId);
            setLoading(false);
          }
        });
      } else {
        clearTimeout(timeoutId);
        setLoading(false);
        toast.error('Service unavailable');
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error:', error);
      setLoading(false);
    }
  };

  const handleDismiss = () => setPromptType(null);

  const handleDismissIOSPrompt = () => {
    localStorage.setItem('ios-install-prompt-dismissed', Date.now().toString());
    setPromptType(null);
  };

  if (!promptType) return null;

  return (
    <div className="fixed top-16 left-4 right-4 z-50 animate-in slide-in-from-top-4 duration-300">
      {promptType === 'standard' && (
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
                <Button size="sm" className="rounded-full text-xs h-8" onClick={handleEnableNotifications} disabled={loading}>
                  {loading ? 'Enabling...' : 'Enable Notifications'}
                </Button>
                <Button size="sm" variant="ghost" className="rounded-full text-xs h-8" onClick={handleDismiss}>
                  Not now
                </Button>
              </div>
            </div>
            <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {promptType === 'ios-install' && (
        <Card className="p-4 shadow-lg border-primary/20 bg-card/95 backdrop-blur-sm">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Share className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm">Get Notifications on iPhone 📲</h3>
              <p className="text-xs text-muted-foreground mt-1">Add to home screen:</p>
              <ol className="text-xs text-muted-foreground mt-2 space-y-1.5 list-decimal list-inside">
                <li>Tap <Share className="inline w-3 h-3 mb-0.5" /></li>
                <li>Tap <span className="font-medium text-foreground">"Add to Home Screen"</span></li>
                <li>Tap <span className="font-medium text-foreground">"Add"</span></li>
              </ol>
              <Button size="sm" variant="ghost" className="rounded-full text-xs h-8 mt-3" onClick={handleDismissIOSPrompt}>
                Got it
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Send, Smartphone, Search, Share, X, Loader2, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { isIOS, isAndroid, isStandalone } from '@/lib/navigation-utils';

declare global {
  interface Window {
    OneSignalDeferred?: Array<(OneSignal: any) => Promise<void>>;
  }
}

const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string }> = {
  test: { title: '🔔 Test Notification', body: 'This is a test push from PawsPlay admin!' },
  walk: { title: '🐕 Walk Reminder', body: "Time for a walk! Your pup is ready to go." },
  medication: { title: '💊 Medication Reminder', body: "Don't forget your pup's medication today." },
  feeding: { title: '🍖 Feeding Reminder', body: "It's feeding time! Your pup is hungry." },
};

export default function AdminTools() {
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

  // -- Geocode Backfill --
  const [geocoding, setGeocoding] = useState(false);

  // -- Notification Diagnostics --
  const [permissionStatus, setPermissionStatus] = useState<string>('unknown');
  const [oneSignalLoaded, setOneSignalLoaded] = useState(false);
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null);

  // -- Targeted Push --
  const [targetUserId, setTargetUserId] = useState('');
  const [lookupResult, setLookupResult] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [notificationType, setNotificationType] = useState('test');
  const [customMessage, setCustomMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // -- Install Preview --
  const [showInstallPreview, setShowInstallPreview] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      if (isNative) {
        try {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const result = await LocalNotifications.checkPermissions();
          setPermissionStatus(result.display === 'granted' ? 'granted' : result.display === 'denied' ? 'denied' : 'default');
        } catch {
          setPermissionStatus('unknown');
        }
      } else if ('Notification' in window) {
        setPermissionStatus(Notification.permission);
      }
    };
    checkPermissions();

    if (window.OneSignalDeferred) {
      setOneSignalLoaded(true);
      window.OneSignalDeferred.push(async (OneSignal: any) => {
        try {
          const id = await OneSignal.User?.PushSubscription?.id;
          setSubscriptionId(id || null);
        } catch { /* ignore */ }
      });
    }
  }, []);

  const handleTestLocal = async () => {
    if (isNative) {
      try {
        const { LocalNotifications } = await import('@capacitor/local-notifications');
        const permResult = await LocalNotifications.checkPermissions();
        if (permResult.display !== 'granted') {
          const reqResult = await LocalNotifications.requestPermissions();
          setPermissionStatus(reqResult.display === 'granted' ? 'granted' : 'denied');
          if (reqResult.display !== 'granted') {
            toast.error('Notification permission denied');
            return;
          }
        }
        await LocalNotifications.schedule({
          notifications: [{
            title: '🐾 PawsPlay Test',
            body: 'Local notification working! 🎉',
            id: Date.now(),
            schedule: { at: new Date(Date.now() + 1000) },
            sound: undefined,
          }],
        });
        toast.success('Local notification scheduled (1 second)');
      } catch (err) {
        toast.error(`Native notification failed: ${err}`);
      }
    } else {
      if (!('Notification' in window)) {
        toast.error('Notifications not supported in this browser');
        return;
      }
      if (Notification.permission === 'granted') {
        new Notification('PawsPlay Test', { body: 'Local notification working! 🎉', icon: '/favicon.png' });
        toast.success('Local notification fired');
      } else if (Notification.permission === 'default') {
        Notification.requestPermission().then((result) => {
          setPermissionStatus(result);
          if (result === 'granted') {
            new Notification('PawsPlay Test', { body: 'Notifications enabled! 🎉', icon: '/favicon.png' });
          }
        });
      } else {
        toast.error('Notifications are blocked. Reset in browser settings.');
      }
    }
  };

  const handleReRequest = () => {
    Notification.requestPermission().then((result) => {
      setPermissionStatus(result);
      toast.info(`Permission: ${result}`);
    });
  };

  const handleLookup = async () => {
    if (!targetUserId.trim()) return;
    setLookingUp(true);
    setLookupResult(null);
    const { data, error } = await supabase
      .from('public_profiles')
      .select('display_name, avatar_url')
      .eq('id', targetUserId.trim())
      .maybeSingle();
    setLookingUp(false);
    if (error || !data) {
      toast.error('User not found');
      return;
    }
    setLookupResult(data);
  };

  const handleSendPush = async () => {
    if (!targetUserId.trim()) {
      toast.error('Enter a user ID first');
      return;
    }
    setSending(true);
    setSendResult(null);
    const template = NOTIFICATION_TEMPLATES[notificationType];
    const body = customMessage.trim() || template.body;
    try {
      const { data, error } = await supabase.functions.invoke('send-test-notification', {
        body: { targetUserId: targetUserId.trim(), title: template.title, body },
      });
      setSendResult(data || error);
      if (error) {
        toast.error('Failed to send');
      } else if (data?.success) {
        toast.success('Push sent!');
      } else {
        toast.error('OneSignal returned an error');
      }
    } catch (err) {
      setSendResult({ error: String(err) });
      toast.error('Request failed');
    } finally {
      setSending(false);
    }
  };

  const handleGeocodeBackfill = async () => {
    setGeocoding(true);
    try {
      const { data, error } = await supabase.functions.invoke('geocode-parks');
      if (error) throw error;
      toast.success(`Geocode complete: ${JSON.stringify(data)}`);
    } catch (err: any) {
      toast.error(`Geocode failed: ${err.message}`);
    } finally {
      setGeocoding(false);
    }
  };

  const permissionColor = permissionStatus === 'granted' ? 'bg-green-500/15 text-green-700' : permissionStatus === 'denied' ? 'bg-red-500/15 text-red-700' : 'bg-yellow-500/15 text-yellow-700';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Tools</h1>
        <p className="text-muted-foreground">Notification testing & install diagnostics</p>
      </div>

      {/* Section 1: Notification Diagnostics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Notification Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-sm font-medium">Permission:</div>
            <Badge variant="outline" className={permissionColor}>{permissionStatus}</Badge>
            <div className="text-sm font-medium ml-2">OneSignal:</div>
            <Badge variant="outline" className={oneSignalLoaded ? 'bg-green-500/15 text-green-700' : 'bg-red-500/15 text-red-700'}>
              {oneSignalLoaded ? 'Loaded' : 'Not loaded'}
            </Badge>
          </div>
          {subscriptionId && (
            <p className="text-xs text-muted-foreground break-all">Subscription ID: {subscriptionId}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" onClick={handleTestLocal}>
              <Bell className="h-4 w-4 mr-1" /> Test Local Notification
            </Button>
            {permissionStatus === 'default' && (
              <Button size="sm" variant="outline" onClick={handleReRequest}>
                Re-request Permission
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Section 2: Targeted Push Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Send className="h-5 w-5" />
            Send Test Push Notification
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter user_id (UUID)"
              value={targetUserId}
              onChange={(e) => { setTargetUserId(e.target.value); setLookupResult(null); setSendResult(null); }}
              className="font-mono text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleLookup} disabled={lookingUp}>
              {lookingUp ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            </Button>
          </div>

          {lookupResult && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="h-8 w-8">
                <AvatarImage src={lookupResult.avatar_url || ''} />
                <AvatarFallback>{lookupResult.display_name?.[0] || '?'}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{lookupResult.display_name || 'No display name'}</span>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs mb-1 block">Notification Type</Label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="test">🔔 Test Notification</SelectItem>
                  <SelectItem value="walk">🐕 Walk Reminder</SelectItem>
                  <SelectItem value="medication">💊 Medication Reminder</SelectItem>
                  <SelectItem value="feeding">🍖 Feeding Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Custom Message (optional)</Label>
              <Input
                placeholder={NOTIFICATION_TEMPLATES[notificationType]?.body}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSendPush} disabled={sending || !targetUserId.trim()}>
            {sending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Send Push Notification
          </Button>

          {sendResult && (
            <pre className="text-xs p-3 rounded-lg bg-muted overflow-auto max-h-40">
              {JSON.stringify(sendResult, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Geocode Backfill */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MapPin className="h-5 w-5" />
            Park Geocoding
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Run the geocode-parks edge function to backfill latitude/longitude for all parks missing coordinates.
          </p>
          <Button onClick={handleGeocodeBackfill} disabled={geocoding}>
            {geocoding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <MapPin className="h-4 w-4 mr-2" />}
            Geocode Missing Parks
          </Button>
        </CardContent>
      </Card>

      {/* Section 4: Install Prompt Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Smartphone className="h-5 w-5" />
            Install Prompt Preview
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline">{isIOS() ? '✅ iOS' : '❌ iOS'}</Badge>
            <Badge variant="outline">{isAndroid() ? '✅ Android' : '❌ Android'}</Badge>
            <Badge variant="outline">{isStandalone() ? '✅ Standalone' : '❌ Standalone'}</Badge>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="install-preview" checked={showInstallPreview} onCheckedChange={setShowInstallPreview} />
            <Label htmlFor="install-preview">Force Show Install Instructions</Label>
          </div>

          {showInstallPreview && (
            <div className="grid gap-4 md:grid-cols-2">
              {/* Standard Prompt Preview */}
              <div className="border rounded-xl p-4 shadow-sm bg-card">
                <p className="text-xs text-muted-foreground mb-2 font-medium">Standard Prompt</p>
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
                      <Button size="sm" className="rounded-full text-xs h-8">Enable Notifications</Button>
                      <Button size="sm" variant="ghost" className="rounded-full text-xs h-8">Not now</Button>
                    </div>
                  </div>
                  <X className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {/* iOS Prompt Preview */}
              <div className="border rounded-xl p-4 shadow-sm bg-card">
                <p className="text-xs text-muted-foreground mb-2 font-medium">iOS Install Prompt</p>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Share className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm">Get Notifications on iPhone 📲</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Add this app to your home screen to receive alerts:
                    </p>
                    <ol className="text-xs text-muted-foreground mt-2 space-y-1.5 list-decimal list-inside">
                      <li>Tap <Share className="inline w-3 h-3 mb-0.5" /> at the bottom of Safari</li>
                      <li>Scroll and tap <span className="font-medium text-foreground">"Add to Home Screen"</span></li>
                      <li>Tap <span className="font-medium text-foreground">"Add"</span> to confirm</li>
                    </ol>
                    <Button size="sm" variant="ghost" className="rounded-full text-xs h-8 mt-3">Got it</Button>
                  </div>
                  <X className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Activity,
  Users,
  MessageSquare,
  Dog,
  Trees,
  Store,
  Lightbulb,
  Settings,
  Bell,
  Send,
  ExternalLink,
  Shield,
  ToggleLeft,
  Database,
  Code,
  HardDrive,
  Terminal,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface PlatformStats {
  total_users: number;
  total_posts: number;
  total_dogs: number;
  total_parks: number;
  total_services: number;
  pending_suggestions: number;
  users_this_week: number;
}

interface AppSetting {
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

const SUPABASE_PROJECT_ID = 'xasbgkggwnkvrceziaix';

export default function AdminSettings() {
  const { user } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [settings, setSettings] = useState<Record<string, AppSetting>>({});
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Maintenance mode local state
  const [maintenanceEnabled, setMaintenanceEnabled] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  // Registration local state
  const [registrationOpen, setRegistrationOpen] = useState(true);

  // Broadcast local state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [broadcasting, setBroadcasting] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchSettings();
  }, []);

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const { data, error } = await supabase.rpc('admin_get_platform_stats');
      if (error) throw error;
      if (data && data.length > 0) {
        setStats(data[0] as unknown as PlatformStats);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
      toast.error('Failed to load platform stats');
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('*');
      if (error) throw error;
      const mapped: Record<string, AppSetting> = {};
      (data || []).forEach((row: any) => {
        mapped[row.key] = row as AppSetting;
      });
      setSettings(mapped);

      // Hydrate local state
      if (mapped.maintenance_mode) {
        const val = mapped.maintenance_mode.value as { enabled?: boolean; message?: string };
        setMaintenanceEnabled(val.enabled ?? false);
        setMaintenanceMessage(val.message ?? '');
      }
      if (mapped.registration_open) {
        const val = mapped.registration_open.value as { enabled?: boolean };
        setRegistrationOpen(val.enabled ?? true);
      }
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setSettingsLoading(false);
    }
  };

  const saveSetting = async (key: string, value: Record<string, unknown>) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key,
          value,
          updated_at: new Date().toISOString(),
          updated_by: user?.id ?? null,
        });
      if (error) throw error;
      toast.success(`${key.replace(/_/g, ' ')} updated`);
      fetchSettings();
    } catch (err) {
      console.error('Failed to save setting:', err);
      toast.error('Failed to save setting');
    } finally {
      setSaving(false);
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastBody.trim()) {
      toast.error('Title and body are required');
      return;
    }
    setBroadcasting(true);
    try {
      // Fetch all user IDs via the admin RPC
      const { data: users, error: usersErr } = await supabase.rpc('admin_get_users');
      if (usersErr) throw usersErr;

      const userIds = (users || []).map((u: { id: string }) => u.id);
      let sent = 0;
      const batchSize = 10;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const promises = batch.map((uid: string) =>
          supabase.functions.invoke('send-test-notification', {
            body: { targetUserId: uid, title: broadcastTitle, body: broadcastBody, data: { type: 'broadcast' } },
          })
        );
        await Promise.allSettled(promises);
        sent += batch.length;
      }

      toast.success(`Broadcast sent to ${sent} users`);
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (err) {
      console.error('Broadcast failed:', err);
      toast.error('Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  const statCards = stats
    ? [
        { label: 'Total Users', value: stats.total_users, icon: Users, color: 'text-blue-500' },
        { label: 'New This Week', value: stats.users_this_week, icon: Activity, color: 'text-green-500' },
        { label: 'Total Posts', value: stats.total_posts, icon: MessageSquare, color: 'text-violet-500' },
        { label: 'Total Dogs', value: stats.total_dogs, icon: Dog, color: 'text-orange-500' },
        { label: 'Total Parks', value: stats.total_parks, icon: Trees, color: 'text-emerald-500' },
        { label: 'Total Services', value: stats.total_services, icon: Store, color: 'text-pink-500' },
        {
          label: 'Pending Suggestions',
          value: stats.pending_suggestions,
          icon: Lightbulb,
          color: stats.pending_suggestions > 0 ? 'text-amber-500' : 'text-muted-foreground',
          highlight: stats.pending_suggestions > 0,
        },
      ]
    : [];

  const quickLinks = [
    { label: 'SQL Editor', desc: 'Run queries directly', icon: Code, url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/sql/new` },
    { label: 'Auth Users', desc: 'Manage auth accounts', icon: Users, url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/users` },
    { label: 'Storage', desc: 'Manage file buckets', icon: HardDrive, url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/storage/buckets` },
    { label: 'Edge Functions', desc: 'Serverless functions', icon: Terminal, url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/functions` },
    { label: 'Logs', desc: 'View platform logs', icon: BarChart3, url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/logs/explorer` },
    { label: 'Auth Providers', desc: 'OAuth & SSO config', icon: Shield, url: `https://supabase.com/dashboard/project/${SUPABASE_PROJECT_ID}/auth/providers` },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Command Center
        </h1>
        <p className="text-muted-foreground">Platform health, controls, and tools</p>
      </div>

      <Tabs defaultValue="health" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="health" className="gap-1.5">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Health</span>
          </TabsTrigger>
          <TabsTrigger value="controls" className="gap-1.5">
            <ToggleLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Controls</span>
          </TabsTrigger>
          <TabsTrigger value="broadcast" className="gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Broadcast</span>
          </TabsTrigger>
          <TabsTrigger value="links" className="gap-1.5">
            <Database className="h-4 w-4" />
            <span className="hidden sm:inline">Links</span>
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: Platform Health ── */}
        <TabsContent value="health">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {statsLoading
              ? Array.from({ length: 7 }).map((_, i) => (
                  <Card key={i}>
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-8 w-16" />
                    </CardContent>
                  </Card>
                ))
              : statCards.map((s) => (
                  <Card key={s.label} className={s.highlight ? 'border-amber-500/50 bg-amber-500/5' : ''}>
                    <CardContent className="p-4 flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <s.icon className={`h-4 w-4 ${s.color}`} />
                        {s.label}
                      </div>
                      <span className="text-2xl font-bold">{s.value.toLocaleString()}</span>
                      {s.highlight && (
                        <Badge variant="outline" className="w-fit text-amber-600 border-amber-400 text-[10px]">
                          Needs review
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                ))}
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" onClick={fetchStats} disabled={statsLoading}>
              Refresh Stats
            </Button>
          </div>
        </TabsContent>

        {/* ── TAB 2: App Controls ── */}
        <TabsContent value="controls" className="space-y-4">
          {settingsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : (
            <>
              {/* Maintenance Mode */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="h-5 w-5 text-destructive" />
                    Maintenance Mode
                  </CardTitle>
                  <CardDescription>
                    When enabled, a banner will be shown to all users across the app.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="maintenance-toggle" className="font-medium">
                      {maintenanceEnabled ? 'Active — Users see the banner' : 'Disabled'}
                    </Label>
                    <Switch
                      id="maintenance-toggle"
                      checked={maintenanceEnabled}
                      onCheckedChange={setMaintenanceEnabled}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maintenance-msg">Banner Message</Label>
                    <Textarea
                      id="maintenance-msg"
                      value={maintenanceMessage}
                      onChange={(e) => setMaintenanceMessage(e.target.value)}
                      placeholder="We are performing scheduled maintenance..."
                      rows={3}
                    />
                  </div>
                  {maintenanceEnabled && (
                    <div className="rounded-lg border border-amber-400/50 bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                      <strong>Preview:</strong> {maintenanceMessage || '(empty message)'}
                    </div>
                  )}
                  <Button
                    onClick={() =>
                      saveSetting('maintenance_mode', { enabled: maintenanceEnabled, message: maintenanceMessage })
                    }
                    disabled={saving}
                    size="sm"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save Maintenance Settings
                  </Button>
                  {settings.maintenance_mode?.updated_at && (
                    <p className="text-xs text-muted-foreground">
                      Last updated: {new Date(settings.maintenance_mode.updated_at).toLocaleString()}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Registration Control */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    User Registration
                  </CardTitle>
                  <CardDescription>
                    Control whether new users can sign up. (Informational flag — enforce via Supabase Auth settings.)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="reg-toggle" className="font-medium">
                      {registrationOpen ? 'Open — New signups allowed' : 'Closed — Signups blocked'}
                    </Label>
                    <Switch
                      id="reg-toggle"
                      checked={registrationOpen}
                      onCheckedChange={setRegistrationOpen}
                    />
                  </div>
                  <Button
                    onClick={() => saveSetting('registration_open', { enabled: registrationOpen })}
                    disabled={saving}
                    size="sm"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                    Save Registration Settings
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ── TAB 3: Broadcast ── */}
        <TabsContent value="broadcast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Push Notification Broadcast
              </CardTitle>
              <CardDescription>Send a push notification to every registered user via OneSignal.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bc-title">Title</Label>
                <Input
                  id="bc-title"
                  value={broadcastTitle}
                  onChange={(e) => setBroadcastTitle(e.target.value)}
                  placeholder="🐾 New Feature Alert!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bc-body">Body</Label>
                <Textarea
                  id="bc-body"
                  value={broadcastBody}
                  onChange={(e) => setBroadcastBody(e.target.value)}
                  placeholder="We just launched something awesome..."
                  rows={3}
                />
              </div>

              {/* Preview */}
              {(broadcastTitle || broadcastBody) && (
                <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                  <p className="text-xs text-muted-foreground font-medium">Preview</p>
                  <p className="font-semibold text-sm">{broadcastTitle || '(no title)'}</p>
                  <p className="text-sm text-muted-foreground">{broadcastBody || '(no body)'}</p>
                </div>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button disabled={!broadcastTitle.trim() || !broadcastBody.trim() || broadcasting}>
                    {broadcasting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-1" />
                        Send to All Users
                      </>
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Send broadcast notification?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will send a push notification to <strong>every user</strong> on the platform. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleBroadcast}>Yes, send it</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── TAB 4: Quick Links ── */}
        <TabsContent value="links">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {quickLinks.map((link) => (
              <a
                key={link.label}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group"
              >
                <Card className="transition-colors group-hover:border-primary/50 h-full">
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className="rounded-md bg-primary/10 p-2">
                      <link.icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-medium text-sm">{link.label}</span>
                        <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-xs text-muted-foreground">{link.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </a>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

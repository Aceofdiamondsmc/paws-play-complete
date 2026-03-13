import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Trees, Settings, ArrowLeft, Shield, Users, Store, MessageSquare, Wrench, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import pawsplayLogo from '@/assets/pawsplay-logo.png';

const adminNavItems = [
  { path: '/admin/parks', icon: Trees, label: 'Parks' },
  { path: '/admin/services', icon: Store, label: 'Services' },
  { path: '/admin/social', icon: MessageSquare, label: 'Social' },
  { path: '/admin/users', icon: Users, label: 'Users' },
  { path: '/admin/vaccinations', icon: ShieldCheck, label: 'Vaccinations' },
  { path: '/admin/tools', icon: Wrench, label: 'Tools' },
  { path: '/admin/settings', icon: Settings, label: 'Settings' },
];

export function AdminLayout() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/parks')}
              className="shrink-0"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img 
              src={pawsplayLogo} 
              alt="PawsPlay" 
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Shield className="h-5 w-5" />
            <span className="font-semibold text-sm">Admin</span>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="border-b bg-muted/30">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
          {adminNavItems.map(({ path, icon: Icon, label }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Admin Content */}
      <main className="p-4">
        <Outlet />
      </main>
    </div>
  );
}

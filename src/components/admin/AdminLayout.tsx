import { Outlet, NavLink, Link } from 'react-router-dom';
import { Trees, Settings, ArrowLeft, Shield, Users, Store, MessageSquare, Wrench, ShieldCheck, LogOut } from 'lucide-react';
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
  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header - with safe-area padding for iOS notch */}
      <header
        className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link to="/me">
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 min-w-[44px] min-h-[44px]"
                asChild
              >
                <span>
                  <ArrowLeft className="h-5 w-5" />
                </span>
              </Button>
            </Link>
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

      {/* Admin Navigation with redundant Exit button */}
      <nav className="border-b bg-muted/30">
        <div className="flex items-center gap-1 px-4 py-2 overflow-x-auto">
          <Link
            to="/me"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap bg-destructive/10 text-destructive hover:bg-destructive/20 mr-1 shrink-0"
          >
            <LogOut className="h-4 w-4" />
            Exit
          </Link>
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

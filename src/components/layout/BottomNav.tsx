import { NavLink, useLocation } from 'react-router-dom';
import { MapPin, Compass, Users, CalendarDays, Heart, User, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const navItems = [
  { path: '/parks', icon: MapPin, label: 'Parks' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/social', icon: Users, label: 'Social' },
  { path: '/dates', icon: CalendarDays, label: 'Dates' },
  { path: '/pack', icon: Heart, label: 'Pack' },
  { path: '/me', icon: User, label: 'Me' },
  { path: '/shop', icon: ShoppingBag, label: 'Shop' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border">
      <div className="flex items-center justify-around h-20 px-2 pb-safe">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          
          return (
            <NavLink
              key={path}
              to={path}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-200 thumb-zone",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("w-6 h-6", isActive && "animate-bounce-in")} />
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-primary rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </div>
              <span className={cn(
                "text-xs font-medium transition-all",
                isActive ? "opacity-100" : "opacity-70"
              )}>
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

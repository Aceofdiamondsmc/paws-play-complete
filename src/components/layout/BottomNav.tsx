import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Trees, Compass, MessageCircle, CalendarDays, PawPrint, User, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/parks', icon: Trees, label: 'Parks' },
  { path: '/explore', icon: Compass, label: 'Explore' },
  { path: '/social', icon: MessageCircle, label: 'Social' },
  { path: '/dates', icon: CalendarDays, label: 'Dates' },
  { path: '/pack', icon: PawPrint, label: 'Pack' },
  { path: '/me', icon: User, label: 'Me' },
  { path: '/shop', icon: ShoppingCart, label: 'Shop' },
];

export function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around h-20 px-2 pb-safe">
        {navItems.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
          
          return (
            <NavLink
              key={path}
              to={path}
              className="flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-2xl transition-all duration-300 ease-in-out min-h-[48px] min-w-[48px]"
            >
              <div className="relative">
                <div className={cn(
                  "absolute inset-0 rounded-full transition-all duration-300 ease-in-out -m-1.5",
                  isActive && "bg-[#228B22]/20 shadow-[0_0_12px_4px_rgba(34,139,34,0.3)]"
                )} />
                <Icon 
                  className={cn(
                    "w-6 h-6 transition-all duration-300 ease-in-out relative z-10",
                    isActive 
                      ? "text-[#228B22] scale-110" 
                      : "text-amber-600 hover:text-[#228B22] active:text-[#1a6b1a]"
                  )} 
                />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-[#228B22] rounded-full" />
                )}
              </div>
              <span className="text-xs font-medium transition-all duration-300 ease-in-out text-black">
                {label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

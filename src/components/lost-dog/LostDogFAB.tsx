import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { LostDogAlertModal } from './LostDogAlertModal';

export function LostDogFAB() {
  const { user, dogs } = useAuth();
  const [open, setOpen] = useState(false);

  // Only show if user is logged in and has dogs
  if (!user || !dogs || dogs.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-36 left-4 z-[99] flex items-center justify-center transition-all animate-pulse-fade hover:animate-none hover:scale-110"
        aria-label="Report Lost Dog"
        style={{ width: '64px', height: '64px', background: 'none', border: 'none', padding: 0 }}
      >
        <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
          {/* Left floppy ear */}
          <path d="M16,22 C12,16 4,16 2,24 C0,32 4,38 10,36 C14,34 16,30 18,28 Z" className="fill-destructive" />
          {/* Right floppy ear */}
          <path d="M48,22 C52,16 60,16 62,24 C64,32 60,38 54,36 C50,34 48,30 46,28 Z" className="fill-destructive" />
          {/* Round head */}
          <ellipse cx="32" cy="38" rx="20" ry="21" className="fill-destructive" />
          {/* SOS text */}
          <text x="32" y="43" textAnchor="middle" dominantBaseline="middle" className="fill-destructive-foreground" style={{ fontSize: '12px', fontWeight: 800, letterSpacing: '0.5px' }}>SOS</text>
        </svg>
      </button>

      <LostDogAlertModal open={open} onOpenChange={setOpen} />
    </>
  );
}

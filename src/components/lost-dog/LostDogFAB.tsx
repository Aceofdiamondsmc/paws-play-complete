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
        className="fixed bottom-28 left-4 z-[99] flex flex-col items-center justify-center bg-destructive text-destructive-foreground shadow-xl hover:bg-destructive/90 transition-all animate-pulse hover:animate-none"
        aria-label="Report Lost Dog"
        style={{
          width: '64px',
          height: '72px',
          clipPath: 'path("M8,28 C0,28 0,18 6,12 L10,4 C12,0 16,0 18,4 L20,10 L44,10 L46,4 C48,0 52,0 54,4 L58,12 C64,18 64,28 56,28 L56,60 C56,68 48,72 32,72 C16,72 8,68 8,60 Z")',
        }}
      >
        {/* Paw icon */}
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 mt-2">
          <ellipse cx="7" cy="5" rx="2.5" ry="3" />
          <ellipse cx="17" cy="5" rx="2.5" ry="3" />
          <ellipse cx="3.5" cy="11" rx="2.5" ry="3" />
          <ellipse cx="20.5" cy="11" rx="2.5" ry="3" />
          <path d="M12 22c-4 0-7-3-7-6 0-2 1.5-4 3.5-5s3.5-1 3.5-1 1.5 0 3.5 1 3.5 3 3.5 5c0 3-3 6-7 6z" />
        </svg>
        <span className="text-[9px] font-bold leading-tight">SOS</span>
      </button>

      <LostDogAlertModal open={open} onOpenChange={setOpen} />
    </>
  );
}

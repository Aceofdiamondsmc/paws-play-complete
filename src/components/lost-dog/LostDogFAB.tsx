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
        className="fixed bottom-28 left-4 z-[99] flex items-center justify-center bg-destructive text-destructive-foreground shadow-xl hover:bg-destructive/90 transition-all animate-pulse-fade hover:animate-none"
        aria-label="Report Lost Dog"
        style={{
          width: '60px',
          height: '64px',
          clipPath: 'path("M30 58 C46 58 54 48 54 36 C54 24 46 16 40 16 C38 16 36 17 35 18 C34 14 32 10 30 10 C28 10 26 14 25 18 C24 17 22 16 20 16 C14 16 6 24 6 36 C6 48 14 58 30 58 Z M16 16 C16 16 10 14 6 18 C1 23 0 30 2 34 C3 28 8 22 16 20 C14 18 14 16 16 16 Z M44 16 C44 16 50 14 54 18 C59 23 60 30 58 34 C57 28 52 22 44 20 C46 18 46 16 44 16 Z")',
        }}
      >
        <span className="text-[11px] font-extrabold mt-3">SOS</span>
      </button>

      <LostDogAlertModal open={open} onOpenChange={setOpen} />
    </>
  );
}

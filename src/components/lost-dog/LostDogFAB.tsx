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
          width: '56px',
          height: '62px',
          clipPath: 'path("M10 20 C10 20 4 18 4 28 C4 42 10 50 28 50 C46 50 52 42 52 28 C52 18 46 20 46 20 C46 20 46 8 40 4 C36 2 32 6 30 10 L26 10 C24 6 20 2 16 4 C10 8 10 20 10 20 Z")',
        }}
      >
        <span className="text-[11px] font-extrabold mt-2">SOS</span>
      </button>

      <LostDogAlertModal open={open} onOpenChange={setOpen} />
    </>
  );
}

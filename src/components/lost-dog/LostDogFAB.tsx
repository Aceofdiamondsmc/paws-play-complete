import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
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
        className="fixed bottom-28 left-4 z-[99] flex items-center gap-2 px-4 py-3 rounded-full bg-destructive text-destructive-foreground shadow-xl hover:bg-destructive/90 transition-all animate-pulse hover:animate-none"
        aria-label="Report lost dog"
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="text-sm font-bold">Pack Alert</span>
      </button>

      <LostDogAlertModal open={open} onOpenChange={setOpen} />
    </>
  );
}

import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Play, PawPrint } from 'lucide-react';
import landingHero from '@/assets/landing-hero.avif';
import { useStats } from '@/contexts/StatsContext';
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { prefetchStats } = useStats();

  // Redirect authenticated users to /me
  useEffect(() => {
    if (!loading && user) {
      navigate('/me', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLetsPlay = () => {
    // Start fetching stats immediately (non-blocking)
    prefetchStats();
    navigate('/social');
  };

  return <div className="relative min-h-[100dvh] flex flex-col items-center overflow-y-auto overflow-x-hidden">
      {/* Background Image - Full screen with object-fit cover for proper proportions */}
      <div className="absolute inset-0">
        <img src={landingHero} alt="Paws Play Repeat" className="w-full h-full object-cover" style={{
        objectPosition: 'center 30%'
      }} />
      </div>
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/40" />
      
      {/* Main Content Container - Flexbox column centered */}
      <div className="relative z-10 flex flex-col items-center w-full min-h-[100dvh]" style={{
      paddingTop: 'max(env(safe-area-inset-top), 24px)'
    }}>
        {/* Paw Print Icon */}
        <div className="mt-4 mb-6">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <PawPrint className="w-6 h-6 text-white" />
          </div>
        </div>
        
        {/* Colorful Title */}
        
        
        {/* Tagline */}
        <p className="text-white/90 text-base font-medium mb-8 text-center">
          Friendly neighbors for furry friends
        </p>
        
        {/* Spacer to push button down */}
        <div className="flex-1" />
        
        {/* Let's Play Button - Smaller size */}
        <button onClick={handleLetsPlay} className="flex items-center justify-center gap-2 bg-[#F5D547] hover:bg-[#E5C537] active:bg-[#D5B527] text-black font-bold text-base px-8 py-3 rounded-full shadow-xl transition-all duration-200 active:scale-95 mb-32">
          <Play className="w-4 h-4 fill-current" />
          Let's Play
        </button>
      </div>

      {/* Footer - Fixed at bottom with safe area */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm py-4 px-4" style={{
      paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'
    }}>
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <a href="/privacy.html" className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
            Privacy Policy
          </a>
          <a href="/tos.html" className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
            Terms of Service
          </a>
          <a href="/support.html" className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
            Support
          </a>
        </div>
        <p className="text-center text-muted-foreground text-xs">
          © 2026 Paws Play Repeat. All rights reserved.
        </p>
      </footer>
    </div>;
}
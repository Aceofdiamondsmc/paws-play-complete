import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import landingPugGlasses from '@/assets/landing-pug-glasses.jpg';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[100dvh] max-h-[105dvh] flex flex-col items-center overflow-x-hidden">
      {/* Background Image - Full screen with object-fit cover for proper proportions */}
      <img 
        src={landingPugGlasses}
        alt="Paws Play Repeat"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/30" />
      
      {/* Main Content Container - Flexbox column centered */}
      <div 
        className="relative z-10 flex flex-col items-center flex-1 w-full"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 16px)' }}
      >
        {/* Top spacer - pushes content into view */}
        <div className="flex-1" />
        
        {/* Bottom spacer for thumb zone positioning */}
        <div className="flex-[2]" />
      </div>

      {/* Floating Let's Play Button - Positioned in thumb zone */}
      <button
        onClick={() => navigate('/parks')}
        className="fixed z-50 left-1/2 -translate-x-1/2 flex items-center justify-center gap-3 bg-[#F5D547] hover:bg-[#E5C537] active:bg-[#D5B527] text-black font-bold text-lg px-12 py-4 rounded-full shadow-2xl transition-all duration-200 active:scale-95"
        style={{ 
          bottom: 'max(calc(env(safe-area-inset-bottom) + 100px), 120px)',
          minWidth: '200px'
        }}
      >
        <Play className="w-5 h-5 fill-current" />
        Let's Play
      </button>

      {/* Footer - Fixed at bottom with safe area */}
      <footer 
        className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm py-4 px-4"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <a href="#" className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors">
            Support
          </a>
        </div>
        <p className="text-center text-muted-foreground text-xs">
          © 2026 Paws Play Repeat. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

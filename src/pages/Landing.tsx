import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import landingPugGlasses from '@/assets/landing-pug-glasses.jpg';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-[110vh] flex flex-col">
      {/* Background Image - Full screen pug with glasses */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landingPugGlasses})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Spacer to push content down */}
        <div className="flex-1 min-h-[40vh]" />

        {/* Empty space for visual breathing room */}
        <div className="flex-1" />
      </div>

      {/* Floating Let's Play Button - Fixed position */}
      <button
        onClick={() => navigate('/parks')}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-[#F5D547] hover:bg-[#E5C537] text-black font-bold text-lg sm:text-xl px-10 sm:px-14 py-4 sm:py-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
        Let's Play
      </button>

      {/* Footer */}
      <footer className="relative z-10 bg-white py-6 px-4 mt-auto">
        <div className="flex flex-wrap justify-center gap-4 sm:gap-8 mb-3">
          <a href="#" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
            Terms of Service
          </a>
          <a href="#" className="text-foreground/80 hover:text-foreground text-sm font-medium transition-colors">
            Support
          </a>
        </div>
        <p className="text-center text-muted-foreground text-sm">
          © 2026 Paws Play Repeat. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

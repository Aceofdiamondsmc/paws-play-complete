import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import pawsplayLogo from '@/assets/pawsplay-logo.png';
import landingPugGlasses from '@/assets/landing-pug-glasses.jpg';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background Image - Full screen pug with glasses */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landingPugGlasses})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Logo Section */}
        <div className="flex-1 flex flex-col items-center pt-12">
          <img 
            src={pawsplayLogo} 
            alt="Paws Play Repeat" 
            className="w-72 h-auto object-contain"
          />
        </div>

        {/* Tagline & Floating Button Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-white text-lg font-medium tracking-wide text-center drop-shadow-lg">
            Friendly neighbors for furry friends
          </p>
        </div>

        {/* Floating Let's Play Button */}
        <div className="pb-8 flex justify-center">
          <button
            onClick={() => navigate('/parks')}
            className="flex items-center gap-3 bg-[#F5D547] hover:bg-[#E5C537] text-black font-bold text-xl px-14 py-5 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
          >
            <Play className="w-6 h-6 fill-current" />
            Let's Play
          </button>
        </div>

        {/* Footer */}
        <footer className="relative z-10 bg-white py-6 px-4">
          <div className="flex justify-center gap-8 mb-3">
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
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Play } from 'lucide-react';
import pawsplayLogo from '@/assets/pawsplay-logo.png';
import landingPug from '@/assets/landing-pug.jpg';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${landingPug})` }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Logo Section */}
        <div className="flex-1 flex flex-col items-center pt-8">
          <img 
            src={pawsplayLogo} 
            alt="Paws Play Repeat" 
            className="w-64 h-auto object-contain"
          />
        </div>

        {/* Tagline & Button Section */}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <p className="text-white text-xl font-medium tracking-wide text-center drop-shadow-lg mb-8">
            Friendly neighbors for furry friends
          </p>
          
          {/* Floating Let's Play Button */}
          <button
            onClick={() => navigate('/parks')}
            className="flex items-center gap-3 bg-[hsl(45,100%,55%)] hover:bg-[hsl(45,100%,50%)] text-black font-bold text-xl px-12 py-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
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

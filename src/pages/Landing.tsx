import { useNavigate } from 'react-router-dom';
import landingPug from '@/assets/landing-pug-sweater.jpeg';
import pawsplayLogo from '@/assets/pawsplay-logo.png';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-[100dvh] flex flex-col overflow-hidden"
      onClick={() => navigate('/parks')}
    >
      {/* Background Image - Full screen */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ 
          backgroundImage: `url(${landingPug})`,
          backgroundPosition: 'center 45%'
        }}
      />
      
      {/* Content Container */}
      <div 
        className="relative z-10 flex flex-col items-center flex-1 px-4"
        style={{ paddingTop: 'max(env(safe-area-inset-top), 40px)' }}
      >
        {/* Paw Logo */}
        <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4">
          <img 
            src={pawsplayLogo} 
            alt="Paws Play Repeat" 
            className="w-7 h-7 object-contain opacity-90"
          />
        </div>
        
        {/* Title - Paws Play Repeat */}
        <h1 className="text-4xl font-bold tracking-wide" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
          <span className="text-[#E85A5A]" style={{ fontStyle: 'italic', fontWeight: 700 }}>Paws</span>
          <span className="text-[#4EAEE8]" style={{ fontStyle: 'italic', fontWeight: 700 }}>Play</span>
          <span className="text-[#6FCF6A]" style={{ fontStyle: 'italic', fontWeight: 700 }}>Repeat</span>
        </h1>
        
        {/* Spacer to push tagline down */}
        <div className="flex-1" />
        
        {/* Tagline */}
        <p 
          className="text-white/90 text-lg tracking-wide mb-12"
          style={{ 
            fontFamily: 'Georgia, serif',
            marginBottom: 'max(env(safe-area-inset-bottom) + 48px, 60px)'
          }}
        >
          Friendly neighbors for furry friends
        </p>
      </div>
    </div>
  );
}

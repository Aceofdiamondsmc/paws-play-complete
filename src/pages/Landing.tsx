import { useNavigate } from 'react-router-dom';
import landingPug from '@/assets/landing-pug-sweater.jpeg';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div 
      className="relative min-h-[100dvh] flex flex-col overflow-hidden cursor-pointer"
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
        {/* Simple Paw Print Icon */}
        <div className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-6">
          <svg 
            width="28" 
            height="28" 
            viewBox="0 0 24 24" 
            fill="none" 
            className="opacity-80"
          >
            {/* Main pad */}
            <ellipse cx="12" cy="14" rx="5" ry="4.5" fill="white"/>
            {/* Top left toe */}
            <ellipse cx="6" cy="7" rx="2.2" ry="2.8" fill="white"/>
            {/* Top right toe */}
            <ellipse cx="18" cy="7" rx="2.2" ry="2.8" fill="white"/>
            {/* Bottom left toe */}
            <ellipse cx="7.5" cy="11" rx="1.8" ry="2.2" fill="white"/>
            {/* Bottom right toe */}
            <ellipse cx="16.5" cy="11" rx="1.8" ry="2.2" fill="white"/>
          </svg>
        </div>
        
        {/* Arched Title - PawsPlayRepeat */}
        <svg 
          viewBox="0 0 300 80" 
          className="w-[85vw] max-w-[340px] h-auto"
          style={{ overflow: 'visible' }}
        >
          <defs>
            <path
              id="textArc"
              d="M 20,70 Q 150,0 280,70"
              fill="transparent"
            />
          </defs>
          <text
            fill="none"
            style={{ 
              fontFamily: 'Georgia, "Times New Roman", serif',
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: '38px'
            }}
          >
            <textPath href="#textArc" startOffset="50%" textAnchor="middle">
              <tspan fill="#E85A5A">Paws</tspan>
              <tspan fill="#4EAEE8">Play</tspan>
              <tspan fill="#6FCF6A">Repeat</tspan>
            </textPath>
          </text>
        </svg>
        
        {/* Spacer to push tagline down */}
        <div className="flex-1" />
        
        {/* Tagline */}
        <p 
          className="text-white/90 text-lg tracking-wide text-center"
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

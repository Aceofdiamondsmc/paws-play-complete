import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Play, PawPrint } from 'lucide-react';
import landingHero from '@/assets/landing-hero.avif';
import { useStats } from '@/contexts/StatsContext';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function Landing() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { prefetchStats } = useStats();
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTos, setShowTos] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

  // Redirect authenticated users to /me
  useEffect(() => {
    if (!loading && user) {
      navigate('/me', { replace: true });
    }
  }, [user, loading, navigate]);

  const handleLetsPlay = () => {
    // Start fetching stats immediately (non-blocking)
    prefetchStats();
    navigate('/dates');
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
        <h1 className="text-4xl font-extrabold italic mb-2 text-center">
          <span 
            className="text-[#FF6B6B]" 
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}
          >
            Paws
          </span>
          <span 
            className="text-[#4ECDC4]" 
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}
          >
            Play
          </span>
          <span 
            className="text-[#95D44A]" 
            style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.5), 0 0 20px rgba(0,0,0,0.3)' }}
          >
            Repeat
          </span>
        </h1>
        
        {/* Tagline */}
        <p className="text-white/90 text-base font-medium mb-8 text-center">
          Friendly neighbors for furry friends
        </p>
        
        {/* Spacer to push button down */}
        <div className="flex-1" />
        
        {/* Let's Play Button - Smaller size */}
        <button onClick={handleLetsPlay} className="flex items-center justify-center gap-2 bg-[#F5D547] hover:bg-[#E5C537] active:bg-[#D5B527] text-black font-bold text-base px-8 py-3 rounded-full shadow-xl transition-all duration-200 active:scale-95 mb-4">
          <Play className="w-4 h-4 fill-current" />
          Let's Play
        </button>

        {/* Browse as Guest */}
        <button
          onClick={() => navigate('/parks')}
          className="flex items-center justify-center gap-2 bg-white/30 hover:bg-white/40 active:bg-white/50 backdrop-blur-sm text-white font-semibold text-sm px-6 py-2.5 rounded-full shadow-lg transition-all duration-200 active:scale-95 mb-44"
          style={{ textShadow: '1px 1px 4px rgba(0,0,0,0.3)' }}
        >
          <PawPrint className="w-4 h-4" />
          Explore Without an Account
        </button>
      </div>

      {/* Footer - Fixed at bottom with safe area */}
      <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm py-4 px-4" style={{
      paddingBottom: 'max(env(safe-area-inset-bottom), 8px)'
    }}>
        <div className="flex flex-wrap justify-center gap-4 mb-2">
          <button 
            onClick={() => setShowPrivacy(true)}
            className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => setShowTos(true)}
            className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors"
          >
            Terms of Service
          </button>
          <button 
            onClick={() => setShowSupport(true)}
            className="text-foreground/70 hover:text-foreground text-xs font-medium transition-colors"
          >
            Support
          </button>
        </div>
        {!isNative && (
          <div className="flex justify-center items-center my-2">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Coming Soon</p>
              <a
                href="https://apps.apple.com/app/id6760650358"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block opacity-60 pointer-events-none transition-opacity duration-300"
              >
                <img
                  src="https://tools.applemediaservices.com/api/badges/download-on-the-app-store/black/en-us?size=250x83"
                  alt="Download on the App Store"
                  className="h-10"
                />
              </a>
            </div>
          </div>
        )}
        <p className="text-center text-muted-foreground text-xs">
          © 2026 Paws Play Repeat. All rights reserved.
        </p>
      </footer>

      {/* Privacy Policy Dialog */}
      <Dialog open={showPrivacy} onOpenChange={setShowPrivacy}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground"><strong>Last Updated:</strong> March 16, 2026</p>
            
            <div>
              <h3 className="font-semibold mb-2">1. Information We Collect</h3>
              <p className="text-muted-foreground">To provide our services, we collect limited personal information when you create an account, including your <strong>Email Address</strong> and <strong>Full Name</strong>. This is collected via third-party authentication providers (Apple and Google).</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. How We Use Information</h3>
              <p className="text-muted-foreground">We use your information solely for account authentication, user identification within the app, and to provide support. We do not sell or share your personal data with third-party advertisers.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">3. Data Storage and Third Parties</h3>
              <p className="text-muted-foreground">We use <strong>Supabase</strong> as our backend database and authentication service. Your data is stored securely according to their industry-standard security protocols. We only share data with these providers to the extent necessary to run the app's services.</p>
            </div>

            <div>
              <h3 className="font-semibold mb-2">4. Account Deletion</h3>
              <p className="text-muted-foreground">You have the right to delete your account and all associated data at any time. You can initiate this process through the "Delete Account" button in your profile settings within the app, or by contacting us directly at the email below.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">5. Contact Us</h3>
              <p className="text-muted-foreground">If you have questions or wish to request data deletion, contact us at: <strong>info@pawsplayrepeat.app</strong></p>
            </div>

            <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground space-x-2">
              <button onClick={() => { setShowPrivacy(false); setShowTos(true); }} className="hover:text-foreground transition-colors underline">Terms of Service</button>
              <span>|</span>
              <button onClick={() => { setShowPrivacy(false); setShowSupport(true); }} className="hover:text-foreground transition-colors underline">Support</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Terms of Service Dialog */}
      <Dialog open={showTos} onOpenChange={setShowTos}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground"><strong>Last Updated:</strong> March 16, 2026</p>
            
            <div>
              <h3 className="font-semibold mb-2">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">By using Paws Play Repeat, you agree to these terms. If you do not agree, please do not use the app.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">2. User Conduct & Content</h3>
              <p className="text-muted-foreground">Users are responsible for the content they contribute. You agree not to post any content that is illegal, offensive, harassing, or violates the rights of others. We reserve the right to remove any content or terminate accounts that violate these rules to maintain a safe community.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">3. Safety Disclaimer</h3>
              <p className="text-muted-foreground">Paws Play Repeat provides information about dog-friendly locations for convenience. We are not responsible for the maintenance, safety, or condition of these locations. You are solely responsible for your own safety and your pet's behavior while visiting any location found through the app.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">4. Account Termination</h3>
              <p className="text-muted-foreground">We reserve the right to suspend or terminate access to our services at our discretion, without notice, for conduct that we believe violates these Terms or is harmful to other users.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">5. Contact Us</h3>
              <p className="text-muted-foreground">Questions? Reach out to: <strong>info@pawsplayrepeat.app</strong></p>
            </div>

            <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground space-x-2">
              <button onClick={() => { setShowTos(false); setShowPrivacy(true); }} className="hover:text-foreground transition-colors underline">Privacy Policy</button>
              <span>|</span>
              <button onClick={() => { setShowTos(false); setShowSupport(true); }} className="hover:text-foreground transition-colors underline">Support</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={showSupport} onOpenChange={setShowSupport}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paws Play Repeat Support</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground">Need help finding a dog-friendly spot or have a suggestion for the app? We're here to help!</p>
            
            <div>
              <h3 className="font-semibold mb-2">Contact Us</h3>
              <p className="text-muted-foreground">The best way to reach us is via email. We typically respond within 24-48 hours.</p>
              <p className="text-muted-foreground mt-1"><strong>Email:</strong> info@pawsplayrepeat.app</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-2">Common Issues</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Location not showing?</strong> Ensure you have granted location permissions in your phone settings.</li>
                <li><strong>Account Questions?</strong> If you need help with your profile or wish to request data deletion, please email us from your registered account email.</li>
                <li><strong>Missing a park?</strong> Send us the details and we'll add it to the map!</li>
              </ul>
            </div>

            <div className="mt-6 pt-4 border-t text-center text-xs text-muted-foreground space-x-2">
              <button onClick={() => { setShowSupport(false); setShowPrivacy(true); }} className="hover:text-foreground transition-colors underline">Privacy Policy</button>
              <span>|</span>
              <button onClick={() => { setShowSupport(false); setShowTos(true); }} className="hover:text-foreground transition-colors underline">Terms of Service</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}
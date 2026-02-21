import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Settings, LogOut, Mail, Lock, Plus, ShieldCheck, PawPrint, Edit2, Users, Calendar, MapPin, Camera, Shield, Share, EyeOff, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useFriendships } from '@/hooks/useFriendships';
import { useMessages } from '@/hooks/useMessages';
import { useVaccinations } from '@/hooks/useVaccinations';
import { PackMemberForm } from '@/components/profile/PackMemberForm';
import { VaccinationForm } from '@/components/profile/VaccinationForm';
import { MessageList } from '@/components/profile/MessageList';
import { ChatView } from '@/components/profile/ChatView';
import { EditProfileForm } from '@/components/profile/EditProfileForm';
import { OnboardingFlow } from '@/components/profile/OnboardingFlow';
import { NotificationsList } from '@/components/profile/NotificationsList';
import { useAdmin } from '@/hooks/useAdmin';
import { toast } from 'sonner';

// Pet-themed placeholder images
const DOG_AVATARS = [
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200&h=200&fit=crop',
  'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=200&h=200&fit=crop',
];

export default function Me() {
  const { user, profile, dogs, signIn, signUp, signInWithGoogle, signOut, loading, refreshProfile } = useAuth();
  const { isAdmin } = useAdmin();
  const { friends } = useFriendships();
  const { conversations, totalUnread } = useMessages();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Modal states
  const [showPackMemberForm, setShowPackMemberForm] = useState(false);
  const [editingDog, setEditingDog] = useState<typeof dogs[0] | undefined>(undefined);
  const [showVaccinationForm, setShowVaccinationForm] = useState(false);
  const [vaccinationDog, setVaccinationDog] = useState<{ id: string; name: string } | null>(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [installDismissed, setInstallDismissed] = useState(() => {
    const dismissedAt = localStorage.getItem('ios-install-dismissed-at');
    if (dismissedAt) {
      const daysSince = (Date.now() - Number(dismissedAt)) / (1000 * 60 * 60 * 24);
      return daysSince < 7;
    }
    return false;
  });

  const dismissInstall = () => {
    localStorage.setItem('ios-install-dismissed-at', String(Date.now()));
    setInstallDismissed(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast.error(error.message);
      } else if (!isLogin) {
        toast.success('Check your email to confirm your account!');
      } else {
        // Successful login - navigate to /me (forces re-render with authenticated state)
        navigate('/me', { replace: true });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditDog = (dog: typeof dogs[0]) => {
    setEditingDog(dog);
    setShowPackMemberForm(true);
  };

  const handleAddPackMember = () => {
    setEditingDog(undefined);
    setShowPackMemberForm(true);
  };

  const handleVaccinations = (dog: { id: string; name: string }) => {
    setVaccinationDog(dog);
    setShowVaccinationForm(true);
  };

  const handleSelectConversation = (conversationId: string) => {
    setSelectedConversation(conversationId);
  };

  // Get the selected conversation's other user info
  const selectedConvoData = conversations.find(c => c.id === selectedConversation);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Show onboarding flow for new users
  if (user && profile?.onboarding_completed === false) {
    return <OnboardingFlow onComplete={refreshProfile} />;
  }

  // Show chat view if conversation selected
  if (selectedConversation) {
    return (
      <ChatView
        conversationId={selectedConversation}
        otherUser={selectedConvoData?.otherUser}
        onBack={() => setSelectedConversation(null)}
      />
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(165,35%,55%)] via-[hsl(165,30%,65%)] to-background pb-24">
        {/* Teal Header with Icon */}
        <div className="flex flex-col items-center pt-8 pb-6">
          <div className="w-20 h-20 bg-[hsl(165,35%,45%)] rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[hsl(165,40%,25%)] italic">
            {isLogin ? 'Welcome Back' : 'Join the Pack'}
          </h1>
          <p className="text-[hsl(165,30%,35%)] text-sm mt-1">
            {isLogin ? 'Sign in to access your profile' : 'Create your account to get started'}
          </p>
        </div>

        {/* Login Card */}
        <div className="flex-1 px-4">
          <Card className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-lg">
            {/* Email/Password Form First */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-[hsl(165,35%,40%)]">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-[hsl(45,25%,80%)] bg-white h-12"
                />
              </div>
              
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-[hsl(165,35%,40%)]">
                  <Lock className="w-4 h-4" />
                  Password
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-[hsl(45,25%,80%)] bg-white h-12"
                />
              </div>

              {isLogin && (
                <div className="text-right -mt-2">
                  <Link
                    to="/forgot-password"
                    className="text-sm text-[hsl(165,40%,45%)] hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}

              <Button
                type="submit" 
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base" 
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative my-5">
              <Separator className="bg-border" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-sm text-muted-foreground">
                Or continue with
              </span>
            </div>

            {/* Google Sign In Button */}
            <Button
              variant="outline"
              className="w-full rounded-xl h-12 gap-3 border-[hsl(45,25%,80%)] hover:bg-muted/50 font-medium"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span className="text-[hsl(165,35%,40%)] font-medium">Continue with Google</span>
            </Button>

            {/* Sign up / Sign in toggle */}
            <p className="text-center text-sm text-muted-foreground mt-5">
              {isLogin ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setIsLogin(!isLogin)}
                className="text-[hsl(165,40%,45%)] font-semibold hover:underline"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-white/20"
            onClick={() => setShowEditProfile(true)}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="w-20 h-20 ring-4 ring-white/30">
              <AvatarImage src={profile?.avatar_url || DOG_AVATARS[0]} />
              <AvatarFallback className="bg-white text-primary text-2xl">
                {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <button 
              onClick={() => setShowEditProfile(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-white text-primary rounded-full flex items-center justify-center shadow-lg"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.display_name || 'Pet Parent'}</h2>
            {profile?.city && profile?.state && (
              <p className="text-primary-foreground/60 text-sm mt-1 flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.city}, {profile.state}
                {profile.location_public === false && (
                  <span className="inline-flex items-center gap-0.5 ml-1 text-xs opacity-70">
                    <EyeOff className="w-3 h-3" /> Hidden
                  </span>
                )}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 -mt-10 space-y-4">
        {/* Profile Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Users className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-primary">{friends.length}</p>
            <p className="text-xs text-muted-foreground">Friends</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <PawPrint className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-primary">{dogs.length}</p>
            <p className="text-xs text-muted-foreground">Pack Members</p>
          </Card>
          <Card className="p-4 text-center">
            <div className="flex items-center justify-center gap-1 text-primary mb-1">
              <Calendar className="w-4 h-4" />
            </div>
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Playdates</p>
          </Card>
        </div>

        {/* Notifications Section */}
        <NotificationsList />

        {/* Messages Section */}
        <MessageList onSelectConversation={handleSelectConversation} />

        {/* My Pack Section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <PawPrint className="w-5 h-5 text-primary" />
              My Pack
            </h3>
            <Button size="sm" variant="outline" className="rounded-full" onClick={handleAddPackMember}>
              <Plus className="w-4 h-4 mr-1" />
              Add Pack Member
            </Button>
          </div>
          {dogs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop" 
                alt="Cute dog"
                className="w-24 h-24 mx-auto mb-3 rounded-full object-cover opacity-60"
              />
              <p className="text-sm">Add your first pup to the pack!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dogs.map((dog, index) => (
                <PackMemberCard 
                  key={dog.id} 
                  dog={dog} 
                  index={index}
                  onEdit={() => handleEditDog(dog)}
                  onVaccinations={() => handleVaccinations({ id: dog.id, name: dog.name })}
                />
              ))}
            </div>
          )}
        </Card>

        {/* Health & Vaccines Card */}
        <Card className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold">Health & Vaccines</h3>
              <p className="text-sm text-muted-foreground">Keep your pups' records up to date</p>
            </div>
          </div>
          {dogs.length > 0 ? (
            <div className="space-y-2">
              {dogs.map(dog => (
                <Button 
                  key={dog.id}
                  variant="outline" 
                  className="w-full justify-between rounded-full"
                  onClick={() => handleVaccinations({ id: dog.id, name: dog.name })}
                >
                  <span>{dog.name}'s Vaccines</span>
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-2">
              Add a pack member to manage their vaccines
            </p>
          )}
        </Card>

        {/* Admin Dashboard Link - Only visible to admins */}
        {isAdmin && (
          <Card className="p-4">
            <Button 
              className="w-full rounded-full gap-2"
              onClick={() => navigate('/admin')}
            >
              <Shield className="w-4 h-4" />
              Admin Dashboard
            </Button>
          </Card>
        )}

        {/* Install Prompt */}
        {!installDismissed && (
          <Card className="p-4 relative">
            <button
              onClick={dismissInstall}
              className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Share className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Get Notifications on iPhone</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Install this app to your Home Screen to receive push notifications.
                </p>
                <ol className="text-xs text-muted-foreground mt-2 space-y-1 list-decimal list-inside">
                  <li>Tap the <strong>Share</strong> button <Share className="w-3 h-3 inline" /> in Safari</li>
                  <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
                  <li>Tap <strong>"Add"</strong> in the top right</li>
                </ol>
              </div>
            </div>
          </Card>
        )}

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full rounded-full mt-4"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {/* Modals */}
      <PackMemberForm 
        open={showPackMemberForm} 
        onClose={() => {
          setShowPackMemberForm(false);
          setEditingDog(undefined);
        }}
        editingDog={editingDog}
      />

      {vaccinationDog && (
        <VaccinationForm
          open={showVaccinationForm}
          onClose={() => {
            setShowVaccinationForm(false);
            setVaccinationDog(null);
          }}
          dogId={vaccinationDog.id}
          dogName={vaccinationDog.name}
        />
      )}

      <EditProfileForm
        open={showEditProfile}
        onClose={() => setShowEditProfile(false)}
        profile={profile}
      />
    </div>
  );
}


// Pack Member Card Component
function PackMemberCard({ 
  dog, 
  index, 
  onEdit, 
  onVaccinations 
}: { 
  dog: { 
    id: string; 
    name: string; 
    breed?: string | null; 
    size?: string | null; 
    energy_level?: string | null;
    avatar_url?: string | null;
  }; 
  index: number;
  onEdit: () => void;
  onVaccinations: () => void;
}) {
  const { isUpToDate } = useVaccinations(dog.id);

  return (
    <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
      <Avatar className="w-16 h-16">
        <AvatarImage src={dog.avatar_url || DOG_AVATARS[index % DOG_AVATARS.length]} />
        <AvatarFallback className="bg-primary text-primary-foreground text-lg">
          {dog.name[0]}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h4 className="font-semibold">{dog.name}</h4>
          {isUpToDate && (
            <Badge variant="secondary" className="gap-1 text-xs bg-green-100 text-green-700 border-green-200">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground truncate">
          {dog.breed || 'Mixed breed'} • {dog.size || 'Medium'}
        </p>
        {dog.energy_level && (
          <span className="text-xs text-muted-foreground">
            {dog.energy_level} energy
          </span>
        )}
      </div>
      <div className="flex gap-1">
        <Button size="icon" variant="ghost" className="rounded-full" onClick={onVaccinations}>
          <ShieldCheck className="w-4 h-4 text-green-500" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-full" onClick={onEdit}>
          <Edit2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

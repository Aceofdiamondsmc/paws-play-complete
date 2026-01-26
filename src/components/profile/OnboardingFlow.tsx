import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PawPrint, User, MapPin, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfileManagement';
import { useDogs } from '@/hooks/useDogs';
import { useAuth } from '@/hooks/useAuth';
import { PackMemberForm } from './PackMemberForm';
import { toast } from 'sonner';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { user, dogs } = useAuth();
  const { updateProfile, completeOnboarding } = useProfile();
  
  const [step, setStep] = useState(1);
  const [displayName, setDisplayName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPackMemberForm, setShowPackMemberForm] = useState(false);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('Please enter your display name');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await updateProfile({
        display_name: displayName.trim(),
        city: city.trim() || undefined,
        state: state.trim() || undefined,
      });

      if (error) throw error;
      
      setStep(2);
    } catch (error) {
      toast.error('Failed to save profile');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDog = () => {
    setShowPackMemberForm(true);
  };

  const handleDogAdded = async () => {
    setShowPackMemberForm(false);
    await finishOnboarding();
  };

  const handleSkipDog = async () => {
    await finishOnboarding();
  };

  const finishOnboarding = async () => {
    setIsSubmitting(true);
    try {
      const { error } = await completeOnboarding();
      if (error) throw error;
      
      toast.success('Welcome to the pack! 🐕');
      onComplete();
      navigate('/social');
    } catch (error) {
      toast.error('Failed to complete setup');
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-primary/20 via-primary/10 to-background pb-24">
      {/* Header */}
      <div className="flex flex-col items-center pt-8 pb-6 px-4">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-4">
          <PawPrint className="w-10 h-10 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-extrabold text-foreground text-center">
          {step === 1 ? 'Welcome to the Pack!' : 'Add Your First Pup'}
        </h1>
        <p className="text-muted-foreground text-sm mt-1 text-center">
          {step === 1 
            ? 'Let\'s set up your profile' 
            : 'Introduce your furry friend to the community'}
        </p>
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mt-4">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            {step > 1 ? <Check className="w-4 h-4" /> : '1'}
          </div>
          <div className={`w-12 h-1 rounded ${step > 1 ? 'bg-primary' : 'bg-muted'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
            step >= 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
          }`}>
            2
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4">
        {step === 1 ? (
          <Card className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-lg">
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="displayName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Display Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="displayName"
                  placeholder="What should we call you?"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="rounded-xl h-12"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city" className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    City
                  </Label>
                  <Input
                    id="city"
                    placeholder="Your city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    placeholder="State"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="rounded-xl h-12"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full rounded-xl h-12 gap-2"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : 'Continue'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        ) : (
          <Card className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-lg text-center">
            <div className="mb-6">
              <img 
                src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop" 
                alt="Cute dog"
                className="w-32 h-32 mx-auto mb-4 rounded-full object-cover ring-4 ring-primary/20"
              />
              <p className="text-muted-foreground text-sm">
                Add your pup's details to connect with other dog owners in your area!
              </p>
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleAddDog}
                className="w-full rounded-xl h-12 gap-2"
              >
                <PawPrint className="w-4 h-4" />
                Add My Dog
              </Button>
              
              <Button 
                variant="ghost"
                onClick={handleSkipDog}
                className="w-full rounded-xl text-muted-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Finishing...' : 'Skip for now'}
              </Button>
            </div>
          </Card>
        )}
      </div>

      {/* Pack Member Form Modal */}
      <PackMemberForm 
        open={showPackMemberForm} 
        onClose={() => setShowPackMemberForm(false)}
        onSuccess={handleDogAdded}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfileManagement';
import { useAuth } from '@/hooks/useAuth';
import { PackMemberForm } from './PackMemberForm';
import { OnboardingProfileSetup } from './OnboardingProfileSetup';
import { OnboardingAddDogStep } from './OnboardingAddDogStep';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface OnboardingFlowProps {
  onComplete: () => void;
}

export function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { completeOnboarding } = useProfile();
  
  const [step, setStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPackMemberForm, setShowPackMemberForm] = useState(false);

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
      
      // Fire-and-forget welcome email
      supabase.functions.invoke('welcome-email', {
        body: { user_id: user?.id },
      }).catch((err) => console.warn('Welcome email failed (non-blocking):', err));
      
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
      <header className="pt-8 pb-4 px-4 text-center">
        <h1 className="text-2xl font-extrabold text-foreground">
          {step === 1 ? 'Set Up Your Profile' : 'Add Your Dog'}
        </h1>
      </header>

      {/* Content */}
      <main className="flex-1">
        {step === 1 ? (
          <OnboardingProfileSetup profile={profile} onNext={() => setStep(2)} />
        ) : (
          <OnboardingAddDogStep isSubmitting={isSubmitting} onAddDog={handleAddDog} onSkip={handleSkipDog} />
        )}
      </main>

      {/* Pack Member Form Modal */}
      <PackMemberForm 
        open={showPackMemberForm} 
        onClose={() => setShowPackMemberForm(false)}
        onSuccess={handleDogAdded}
      />
    </div>
  );
}

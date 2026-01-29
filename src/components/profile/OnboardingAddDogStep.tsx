import React from 'react';
import { PawPrint } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface OnboardingAddDogStepProps {
  isSubmitting: boolean;
  onAddDog: () => void;
  onSkip: () => void;
}

export function OnboardingAddDogStep({ isSubmitting, onAddDog, onSkip }: OnboardingAddDogStepProps) {
  return (
    <div className="px-4">
      <Card className="w-full max-w-md mx-auto p-6 rounded-2xl shadow-lg text-center">
        <div className="mb-6">
          <img
            src="https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=200&h=200&fit=crop"
            alt="Cute dog"
            className="w-32 h-32 mx-auto mb-4 rounded-full object-cover ring-4 ring-primary/20"
            loading="lazy"
          />
          <p className="text-muted-foreground text-sm">
            Add your pup’s details to connect with other dog owners in your area.
          </p>
        </div>

        <div className="space-y-3">
          <Button onClick={onAddDog} className="w-full rounded-xl h-12 gap-2">
            <PawPrint className="w-4 h-4" />
            Add My Dog
          </Button>

          <Button
            variant="ghost"
            onClick={onSkip}
            className="w-full rounded-xl text-muted-foreground"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Finishing…' : 'Skip for now'}
          </Button>
        </div>
      </Card>
    </div>
  );
}

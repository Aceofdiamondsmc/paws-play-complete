import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface SubscriptionState {
  isSubscribed: boolean;
  isTrialing: boolean;
  status: string | null;
  trialEnd: string | null;
  subscriptionEnd: string | null;
  isLoading: boolean;
}

export function useSubscription() {
  const { user } = useAuth();
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isTrialing: false,
    status: null,
    trialEnd: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  const checkSubscription = useCallback(async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false, isSubscribed: false, isTrialing: false, status: null }));
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;

      setState({
        isSubscribed: data.subscribed === true,
        isTrialing: data.status === 'trialing',
        status: data.status ?? null,
        trialEnd: data.trial_end ?? null,
        subscriptionEnd: data.subscription_end ?? null,
        isLoading: false,
      });
    } catch (err) {
      console.error('Failed to check subscription:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [user]);

  useEffect(() => {
    checkSubscription();
    const interval = setInterval(checkSubscription, 60_000);
    return () => clearInterval(interval);
  }, [checkSubscription]);

  const startTrial = async () => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-trial-checkout');
      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start trial');
    }
  };

  const trialDaysLeft = state.trialEnd
    ? Math.max(0, Math.ceil((new Date(state.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const manageSubscription = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to open subscription management');
    }
  };

  return {
    ...state,
    trialDaysLeft,
    startTrial,
    manageSubscription,
    refreshSubscription: checkSubscription,
  };
}

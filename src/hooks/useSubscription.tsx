import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useIAP } from '@/hooks/useIAP';
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
  const iap = useIAP();
  
  const [state, setState] = useState<SubscriptionState>({
    isSubscribed: false,
    isTrialing: false,
    status: null,
    trialEnd: null,
    subscriptionEnd: null,
    isLoading: true,
  });

  // On native iOS, delegate to useIAP
  useEffect(() => {
    if (iap.isNative) {
      setState({
        isSubscribed: iap.isPremium,
        isTrialing: iap.isTrialing,
        status: iap.isPremium ? (iap.isTrialing ? 'trialing' : 'active') : null,
        trialEnd: null,
        subscriptionEnd: null,
        isLoading: iap.isLoading,
      });
    }
  }, [iap.isNative, iap.isPremium, iap.isTrialing, iap.isLoading]);

  // On web, use Stripe check-subscription
  const checkSubscription = useCallback(async () => {
    if (iap.isNative) return; // Skip on native
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
  }, [user, iap.isNative]);

  useEffect(() => {
    if (!iap.isNative) {
      checkSubscription();
      const interval = setInterval(checkSubscription, 60_000);
      return () => clearInterval(interval);
    }
  }, [checkSubscription, iap.isNative]);

  // Start trial: native uses IAP with Stripe fallback, web uses Stripe
  const startTrial = async (type: 'monthly' | 'annual' = 'monthly') => {
    if (!user) {
      toast.error('Please sign in first');
      return;
    }

    if (iap.isNative) {
      const result = await iap.purchaseByType(type);
      if (result === 'success' || result === 'cancelled') return;
      // IAP failed — fall through to Stripe web checkout
      console.log('[Subscription] IAP failed, falling back to Stripe checkout');
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-trial-checkout');
      if (error) throw error;

      if (data?.url) {
        if (iap.isNative) {
          // On native, open Stripe in in-app browser
          try {
            const { Browser } = await import('@capacitor/browser');
            await Browser.open({ url: data.url });
          } catch {
            window.location.href = data.url;
          }
        } else {
          window.location.href = data.url;
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to start trial');
    }
  };

  const trialDaysLeft = iap.isNative
    ? iap.trialDaysLeft
    : state.trialEnd
      ? Math.max(0, Math.ceil((new Date(state.trialEnd).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
      : null;

  // Manage subscription: native opens App Store, web opens Stripe portal
  const manageSubscription = async () => {
    if (iap.isNative) {
      await iap.manageSubscription();
      return;
    }

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

  // Restore purchases (native only)
  const restorePurchases = iap.isNative ? iap.restore : undefined;

  return {
    ...state,
    trialDaysLeft,
    startTrial,
    manageSubscription,
    restorePurchases,
    refreshSubscription: iap.isNative ? iap.refreshEntitlements : checkSubscription,
  };
}

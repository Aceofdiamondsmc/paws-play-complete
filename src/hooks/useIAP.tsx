import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

// RevenueCat public API key — safe to store in code (publishable)
const REVENUECAT_API_KEY = 'appl_VwKCwgyesJPBdIJoFPzlvxwZowm';

interface IAPState {
  isPremium: boolean;
  isTrialing: boolean;
  isLoading: boolean;
  trialDaysLeft: number | null;
}

export function useIAP() {
  const { user } = useAuth();
  const [state, setState] = useState<IAPState>({
    isPremium: false,
    isTrialing: false,
    isLoading: true,
    trialDaysLeft: null,
  });
  const [rcInitialized, setRcInitialized] = useState(false);

  // Initialize RevenueCat on native
  useEffect(() => {
    if (!isNative || !user || rcInitialized) return;

    const init = async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: user.id,
        });
        setRcInitialized(true);
        console.log('[IAP] RevenueCat initialized');
      } catch (err) {
        console.error('[IAP] Failed to initialize RevenueCat:', err);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    init();
  }, [user, rcInitialized]);

  // Check entitlements
  const checkEntitlements = useCallback(async () => {
    if (!isNative || !rcInitialized) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.getCustomerInfo();
      
      const premiumEntitlement = customerInfo.entitlements.active['premium'];
      const isPremium = !!premiumEntitlement;
      const isTrialing = premiumEntitlement?.periodType === 'TRIAL';
      
      let trialDaysLeft: number | null = null;
      if (isTrialing && premiumEntitlement?.expirationDate) {
        const expDate = new Date(premiumEntitlement.expirationDate);
        trialDaysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      setState({
        isPremium,
        isTrialing,
        isLoading: false,
        trialDaysLeft,
      });

      // Sync to backend
      if (isPremium && user) {
        syncToBackend(customerInfo).catch(console.error);
      }
    } catch (err) {
      console.error('[IAP] Failed to check entitlements:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [rcInitialized, user]);

  useEffect(() => {
    if (rcInitialized) {
      checkEntitlements();
    }
  }, [rcInitialized, checkEntitlements]);

  // Purchase
  const purchase = async () => {
    if (!isNative) return;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      // Note: getOfferings() has a known type mismatch — runtime returns { offerings: PurchasesOfferings }
      const offeringsResult: any = await Purchases.getOfferings();
      const currentOffering = offeringsResult?.current || offeringsResult?.offerings?.current;
      if (!currentOffering) {
        toast.error('No subscription packages available');
        return;
      }

      // Get the monthly package (or the first available)
      const pkg = currentOffering.monthly || currentOffering.availablePackages[0];
      if (!pkg) {
        toast.error('No subscription package found');
        return;
      }

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      
      if (customerInfo.entitlements.active['premium']) {
        toast.success('Welcome to Premium! 🎉');
        await checkEntitlements();
      }
    } catch (err: any) {
      if (err?.code === 1 || err?.message?.includes('cancelled')) {
        // User cancelled — not an error
        return;
      }
      console.error('[IAP] Purchase failed:', err);
      toast.error('Purchase failed. Please try again.');
    }
  };

  // Restore purchases
  const restore = async () => {
    if (!isNative) return;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active['premium']) {
        toast.success('Purchases restored!');
        await checkEntitlements();
      } else {
        toast.info('No active purchases found');
      }
    } catch (err) {
      console.error('[IAP] Restore failed:', err);
      toast.error('Failed to restore purchases');
    }
  };

  // Manage subscription — opens App Store subscription management
  const manageSubscription = async () => {
    if (!isNative) return;
    
    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { managementURL } = await Purchases.getCustomerInfo()
        .then(({ customerInfo }) => ({ managementURL: customerInfo.managementURL }));
      
      if (managementURL) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: managementURL });
      } else {
        // Fallback to generic App Store subscriptions URL
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: 'https://apps.apple.com/account/subscriptions' });
      }
    } catch (err) {
      console.error('[IAP] Manage subscription failed:', err);
      // Fallback
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
    }
  };

  // Sync IAP state to Supabase backend
  const syncToBackend = async (customerInfo: any) => {
    try {
      await supabase.functions.invoke('validate-iap-receipt', {
        body: {
          user_id: user?.id,
          entitlements: customerInfo.entitlements.active,
          original_app_user_id: customerInfo.originalAppUserId,
        },
      });
    } catch (err) {
      console.warn('[IAP] Backend sync failed (non-blocking):', err);
    }
  };

  return {
    ...state,
    purchase,
    restore,
    manageSubscription,
    refreshEntitlements: checkEntitlements,
    isNative,
  };
}

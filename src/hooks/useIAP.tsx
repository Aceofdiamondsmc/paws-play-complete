import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

// RevenueCat public API key — safe to store in code (publishable)
const REVENUECAT_API_KEY = 'appl_VwKCwgyesJPBdIJoFPzlvxwZowm';

// Approved App Store product IDs
const PRODUCT_ID_MONTHLY = 'com.pawsplayrepeat.starter_monthly';
const PRODUCT_ID_YEARLY = 'com.pawsplayrepeat.starter_yearly';

// RevenueCat entitlement ID
const ENTITLEMENT_ID = 'premium';

interface IAPState {
  isPremium: boolean;
  isTrialing: boolean;
  isLoading: boolean;
  trialDaysLeft: number | null;
  storeReady: boolean;
}

export function useIAP() {
  const { user } = useAuth();
  const [state, setState] = useState<IAPState>({
    isPremium: false,
    isTrialing: false,
    isLoading: true,
    trialDaysLeft: null,
    storeReady: false,
  });

  // Initialize RevenueCat on native
  useEffect(() => {
    if (!isNative || !user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    let cancelled = false;

    const init = async () => {
      try {
        const { Purchases } = await import('@revenuecat/purchases-capacitor');
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
          appUserID: user.id,
        });
        console.log('[IAP] RevenueCat configured for user:', user.id);

        // Verify we can fetch offerings to confirm store is ready
        const offeringsResult: any = await Purchases.getOfferings();
        const currentOffering = offeringsResult?.current || offeringsResult?.offerings?.current;
        console.log('[IAP] Store ready. Current offering:', currentOffering?.identifier || 'none');
        console.log('[IAP] Available packages:', currentOffering?.availablePackages?.map((p: any) => 
          `${p.identifier} (${p.product?.identifier || 'unknown'})`
        ) || []);

        if (!cancelled) {
          setState(prev => ({ ...prev, storeReady: true }));
        }
      } catch (err) {
        console.error('[IAP] Failed to initialize RevenueCat:', err);
        if (!cancelled) {
          setState(prev => ({ ...prev, isLoading: false, storeReady: false }));
        }
      }
    };

    init();
    return () => { cancelled = true; };
  }, [user]);

  // Check entitlements once store is ready
  const checkEntitlements = useCallback(async () => {
    if (!isNative || !state.storeReady) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.getCustomerInfo();
      
      const premiumEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      const isPremium = !!premiumEntitlement;
      const isTrialing = premiumEntitlement?.periodType === 'TRIAL';
      
      let trialDaysLeft: number | null = null;
      if (isTrialing && premiumEntitlement?.expirationDate) {
        const expDate = new Date(premiumEntitlement.expirationDate);
        trialDaysLeft = Math.max(0, Math.ceil((expDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
      }

      console.log('[IAP] Entitlements checked — premium:', isPremium, 'trialing:', isTrialing);

      setState(prev => ({
        ...prev,
        isPremium,
        isTrialing,
        isLoading: false,
        trialDaysLeft,
      }));

      // Sync to backend
      if (isPremium && user) {
        syncToBackend(customerInfo).catch(console.error);
      }
    } catch (err) {
      console.error('[IAP] Failed to check entitlements:', err);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, [state.storeReady, user]);

  useEffect(() => {
    if (state.storeReady) {
      checkEntitlements();
    }
  }, [state.storeReady, checkEntitlements]);

  // Purchase by package type
  const purchaseByType = async (type: 'monthly' | 'annual' = 'monthly'): Promise<'success' | 'cancelled' | 'not_ready' | 'error'> => {
    if (!isNative) return 'error';

    if (!state.storeReady) {
      console.warn('[IAP] Store not ready yet, cannot purchase');
      toast.error('App Store is still loading. Please wait a moment and try again.');
      return 'not_ready';
    }

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const offeringsResult: any = await Purchases.getOfferings();
      const currentOffering = offeringsResult?.current || offeringsResult?.offerings?.current;
      
      console.log('[IAP] Fetched offerings for purchase. Current:', currentOffering?.identifier);

      if (!currentOffering) {
        console.error('[IAP] No current offering found. Check RevenueCat dashboard.');
        toast.error('No subscription plans available. Please contact support.');
        return 'error';
      }

      // Log all available packages for debugging
      const availablePackages = currentOffering.availablePackages || [];
      console.log('[IAP] Available packages:', availablePackages.map((p: any) => ({
        identifier: p.identifier,
        productId: p.product?.identifier || p.storeProduct?.productIdentifier,
        type: p.packageType,
      })));

      // Find the correct package — match by product ID first, then by RC type
      const targetProductId = type === 'annual' ? PRODUCT_ID_YEARLY : PRODUCT_ID_MONTHLY;
      
      let pkg = availablePackages.find((p: any) => {
        const productId = p.product?.identifier || p.storeProduct?.productIdentifier || '';
        return productId === targetProductId;
      });

      // Fallback: match by RevenueCat package type
      if (!pkg) {
        console.log('[IAP] No product ID match, falling back to package type lookup');
        if (type === 'annual') {
          pkg = currentOffering.annual || availablePackages.find((p: any) => 
            p.identifier === '$rc_annual' || p.packageType === 'ANNUAL'
          );
        } else {
          pkg = currentOffering.monthly || availablePackages.find((p: any) => 
            p.identifier === '$rc_monthly' || p.packageType === 'MONTHLY'
          );
        }
      }

      if (!pkg) {
        console.error('[IAP] No package found for type:', type, 'target product:', targetProductId);
        toast.error(`The ${type} plan is not available right now. Please try again later.`);
        return 'error';
      }

      console.log('[IAP] Purchasing package:', pkg.identifier, 'product:', targetProductId);
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        toast.success('Welcome to Premium! 🎉');
        await checkEntitlements();
        return 'success';
      }
      
      console.error('[IAP] Purchase completed but entitlement not active');
      toast.error('Purchase completed but access not granted. Try "Restore Purchases".');
      return 'error';
    } catch (err: any) {
      if (err?.code === 1 || err?.message?.includes('cancelled') || err?.userCancelled) {
        console.log('[IAP] User cancelled purchase');
        return 'cancelled';
      }
      console.error('[IAP] Purchase failed:', JSON.stringify(err, null, 2));
      toast.error('Purchase failed. Please check your App Store account and try again.');
      return 'error';
    }
  };

  // Legacy purchase (defaults to monthly)
  const purchase = () => purchaseByType('monthly');

  // Restore purchases
  const restore = async () => {
    if (!isNative) return;

    try {
      const { Purchases } = await import('@revenuecat/purchases-capacitor');
      const { customerInfo } = await Purchases.restorePurchases();
      
      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
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
      const { customerInfo } = await Purchases.getCustomerInfo();
      const managementURL = customerInfo.managementURL;
      
      if (managementURL) {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: managementURL });
      } else {
        const { Browser } = await import('@capacitor/browser');
        await Browser.open({ url: 'https://apps.apple.com/account/subscriptions' });
      }
    } catch (err) {
      console.error('[IAP] Manage subscription failed:', err);
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
      console.log('[IAP] Backend sync successful');
    } catch (err) {
      console.warn('[IAP] Backend sync failed (non-blocking):', err);
    }
  };

  return {
    ...state,
    purchase,
    purchaseByType,
    restore,
    manageSubscription,
    refreshEntitlements: checkEntitlements,
    isNative,
  };
}

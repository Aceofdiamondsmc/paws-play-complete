import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Crown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/hooks/useSubscription';
import { useIAP } from '@/hooks/useIAP';
import { Loader2 } from 'lucide-react';

const isNative = !!(window as any).Capacitor?.isNativePlatform?.();

const features = [
  'Priority directory listing',
  'Searchable by all users',
  'Contact info displayed',
  'Business profile page',
  'Cancel anytime',
];

const Plans = () => {
  const navigate = useNavigate();
  const { startTrial, restorePurchases, isSubscribed, isTrialing } = useSubscription();
  const iap = useIAP();
  const storeLoading = isNative && !iap.storeReady;
  const buttonsDisabled = isSubscribed || storeLoading;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-foreground">Choose Your Plan</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-4 flex-1">
        {/* Hero */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-2 text-primary">
            <Crown className="h-7 w-7" />
            <span className="text-xl font-extrabold tracking-tight">Paws Play Repeat Pro</span>
          </div>
          <p className="text-muted-foreground text-sm">
            Boost your pet business with a premium listing
          </p>
        </div>

        {/* Plan Cards */}
        <div className="grid grid-cols-2 gap-3">
          {/* Monthly */}
          <Card className="relative border-2 border-border hover:border-primary/40 transition-colors">
            <CardHeader className="pb-2 pt-4 px-3 text-center">
              <CardTitle className="text-base font-bold text-foreground">Monthly</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-extrabold text-foreground">$9.99</span>
                <span className="text-muted-foreground text-sm">/mo</span>
              </div>
            </CardHeader>
            <CardContent className="px-3 pb-4 space-y-3">
              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                size="sm"
                onClick={() => startTrial('monthly')}
                disabled={buttonsDisabled}
              >
                {storeLoading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Loading...</>
                ) : isSubscribed ? 'Subscribed' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>

          {/* Yearly */}
          <Card className="relative border-2 border-primary shadow-md">
            <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-2">
              <Sparkles className="h-3 w-3 mr-1" />
              SAVE 17%
            </Badge>
            <CardHeader className="pb-2 pt-4 px-3 text-center">
              <CardTitle className="text-base font-bold text-foreground">Yearly</CardTitle>
              <div className="mt-1">
                <span className="text-2xl font-extrabold text-foreground">$99.99</span>
                <span className="text-muted-foreground text-sm">/yr</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">~$8.33/mo • Best value</p>
            </CardHeader>
            <CardContent className="px-3 pb-4 space-y-3">
              <ul className="space-y-1.5">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-1.5 text-xs text-foreground">
                    <Check className="h-3.5 w-3.5 text-success shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className="w-full"
                size="sm"
                onClick={() => startTrial('annual')}
                disabled={buttonsDisabled}
              >
                {storeLoading ? (
                  <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Loading...</>
                ) : isSubscribed ? 'Subscribed' : 'Start Free Trial'}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2 pb-8">
          <p className="text-sm text-muted-foreground">
            🎉 Includes a <span className="font-semibold text-foreground">30-day free trial</span>
          </p>
          {isTrialing && (
            <p className="text-sm text-success font-medium">You're currently on a free trial!</p>
          )}
          {restorePurchases && (
            <button
              onClick={restorePurchases}
              className="text-sm text-primary underline underline-offset-2 hover:text-primary/80"
            >
              Restore Purchases
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Plans;

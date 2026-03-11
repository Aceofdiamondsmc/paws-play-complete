import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Sparkles, Crown, Clock, Loader2, UserPlus, Settings } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export function FreeTrialBanner() {
  const { user } = useAuth();
  const { isSubscribed, isTrialing, trialDaysLeft, isLoading, startTrial, manageSubscription } = useSubscription();
  const [isStarting, setIsStarting] = useState(false);
  const [isManaging, setIsManaging] = useState(false);
  const navigate = useNavigate();

  // Show sign-up CTA for logged-out users
  if (!user) {
    return (
      <Card className="p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-lg">1st Month Free</h3>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>✓ Full access to all premium features</li>
            <li>✓ Priority service listings</li>
            <li>✓ Cancel anytime — no charge if cancelled within 30 days</li>
          </ul>
          <p className="text-xs text-muted-foreground">Then $9.99/month</p>
          <Button
            onClick={() => navigate('/')}
            className="w-full rounded-full font-bold"
            size="lg"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Sign Up to Start Free Trial
          </Button>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return <Skeleton className="h-24 w-full rounded-xl" />;
  }

  const handleStartTrial = async () => {
    setIsStarting(true);
    try {
      await startTrial();
    } finally {
      setIsStarting(false);
    }
  };

  const handleManage = async () => {
    setIsManaging(true);
    try {
      await manageSubscription();
    } finally {
      setIsManaging(false);
    }
  };

  // Active paid subscription
  if (isSubscribed && !isTrialing) {
    return (
      <Card className="p-4 border-2 border-warning/40 bg-gradient-to-r from-warning/10 to-warning/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-warning/20">
            <Crown className="w-5 h-5 text-warning" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm flex items-center gap-1.5">
              Premium Member
              <Badge variant="secondary" className="text-xs bg-warning/20 text-warning border-warning/30">Active</Badge>
            </p>
            <p className="text-xs text-muted-foreground">You have full access to all premium features</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={handleManage} disabled={isManaging}>
          {isManaging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
          Manage Subscription
        </Button>
      </Card>
    );
  }

  // Active trial
  if (isTrialing && trialDaysLeft !== null) {
    return (
      <Card className="p-4 border-2 border-success/40 bg-gradient-to-r from-success/10 to-success/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-success/20">
            <Clock className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm flex items-center gap-1.5">
              Premium Trial Active
              <Badge variant="secondary" className="text-xs bg-success/20 text-success border-success/30">
                {trialDaysLeft} day{trialDaysLeft !== 1 ? 's' : ''} left
              </Badge>
            </p>
            <p className="text-xs text-muted-foreground">Enjoying full premium access • Cancel anytime</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full mt-3" onClick={handleManage} disabled={isManaging}>
          {isManaging ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Settings className="w-4 h-4 mr-2" />}
          Manage Subscription
        </Button>
      </Card>
    );
  }

  // No subscription — show CTA
  return (
    <Card className="p-5 border-2 border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-background overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
      <div className="relative space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg">1st Month Free</h3>
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>✓ Full access to all premium features</li>
          <li>✓ Priority service listings</li>
          <li>✓ Cancel anytime — no charge if cancelled within 30 days</li>
        </ul>
        <p className="text-xs text-muted-foreground">Then $9.99/month</p>
        <Button
          onClick={handleStartTrial}
          disabled={isStarting}
          className="w-full rounded-full font-bold"
          size="lg"
        >
          {isStarting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Start Your Free Trial
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}

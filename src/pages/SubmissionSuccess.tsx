import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, Store, Settings, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function SubmissionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      toast.error('Unable to open subscription portal');
    } finally {
      setLoadingPortal(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-success/5 to-background">
      {/* Safe-area header for iOS */}
      <div
        className="bg-card border-b p-4 sticky top-0 z-50"
        style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 12px)' }}
      >
        <div className="max-w-md mx-auto flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="min-w-[44px] min-h-[44px]"
            onClick={() => navigate('/services')}
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold">Submission Complete</h1>
        </div>
      </div>
      <div className="flex items-center justify-center p-4 flex-1">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for submitting your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-medium">What happens next?</h4>
                <p className="text-sm text-muted-foreground">
                  Our team will review your submission within 24-48 hours. 
                  Once approved, your business will appear in the directory.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-sm">While you wait:</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Confirmation email sent
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" />
                Payment processed securely
              </li>
              <li className="flex items-center gap-2">
                <Store className="w-4 h-4 text-muted-foreground" />
                Explore other pet services
              </li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate('/services')} className="w-full">
              Explore Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button 
              variant="outline" 
              onClick={handleManageSubscription}
              disabled={loadingPortal}
              className="w-full"
            >
              {loadingPortal ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Settings className="w-4 h-4 mr-2" />
              )}
              Manage Subscription
            </Button>
            <Button variant="ghost" onClick={() => navigate('/me')} className="w-full">
              Go to My Profile
            </Button>
          </div>

          {sessionId && (
            <p className="text-xs text-center text-muted-foreground">
              Reference: {sessionId.slice(0, 16)}...
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

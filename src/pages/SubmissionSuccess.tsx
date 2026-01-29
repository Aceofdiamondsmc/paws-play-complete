import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, ArrowRight, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function SubmissionSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="min-h-screen bg-gradient-to-b from-success/5 to-background flex items-center justify-center p-4">
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
            <Button onClick={() => navigate('/explore')} className="w-full">
              Explore Services
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" onClick={() => navigate('/me')} className="w-full">
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

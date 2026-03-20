import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, PawPrint, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const emailSchema = z.string().trim().email('Please enter a valid email address');

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEmailSent, setIsEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate email
    const result = emailSchema.safeParse(email);
    if (!result.success) {
      toast.error(result.error.errors[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        toast.error(error.message);
      } else {
        setIsEmailSent(true);
        toast.success('Check your email for the reset link!');
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(165,35%,55%)] via-[hsl(165,30%,65%)] to-background pb-24">
      {/* Header with Icon */}
      <div className="flex flex-col items-center pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)' }}>
        <div className="w-20 h-20 bg-[hsl(165,35%,45%)] rounded-full flex items-center justify-center mb-4">
          {isEmailSent ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <PawPrint className="w-10 h-10 text-white" />
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-[hsl(165,40%,25%)] italic">
          {isEmailSent ? 'Check Your Email' : 'Reset Password'}
        </h1>
        <p className="text-[hsl(165,30%,35%)] text-sm mt-1 text-center px-4">
          {isEmailSent 
            ? "We've sent you a link to reset your password"
            : "Enter your email and we'll send you a reset link"
          }
        </p>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4">
        <Card className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-lg">
          {isEmailSent ? (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground text-sm">
                Didn't receive the email? Check your spam folder or try again.
              </p>
              <Button
                variant="outline"
                className="w-full rounded-xl h-12"
                onClick={() => setIsEmailSent(false)}
              >
                Try Again
              </Button>
              <Link
                to="/me"
                className="flex items-center justify-center gap-2 text-sm text-[hsl(165,40%,45%)] hover:underline mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-[hsl(165,35%,40%)]">
                  <Mail className="w-4 h-4" />
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border-[hsl(45,25%,80%)] bg-white h-12"
                  autoComplete="email"
                  autoFocus
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Link
                to="/me"
                className="flex items-center justify-center gap-2 text-sm text-[hsl(165,40%,45%)] hover:underline mt-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Sign In
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

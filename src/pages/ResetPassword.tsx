import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, PawPrint, CheckCircle, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  useEffect(() => {
    // Listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveryMode(true);
      }
    });

    // Check if we're already in a session (user clicked email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const getPasswordStrength = (pwd: string): { label: string; color: string; width: string } => {
    if (pwd.length === 0) return { label: '', color: '', width: '0%' };
    if (pwd.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' };
    if (pwd.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' };
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
      return { label: 'Good', color: 'bg-yellow-500', width: '75%' };
    }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) {
      return { label: 'Strong', color: 'bg-green-500', width: '100%' };
    }
    return { label: 'Fair', color: 'bg-yellow-500', width: '50%' };
  };

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        toast.error(error.message);
      } else {
        setIsSuccess(true);
        toast.success('Password updated successfully!');
        
        // Redirect to /me after a short delay
        setTimeout(() => {
          navigate('/me', { replace: true });
        }, 2000);
      }
    } catch (err) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show a message if not in recovery mode
  if (!isRecoveryMode && !isSuccess) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(165,35%,55%)] via-[hsl(165,30%,65%)] to-background pb-24">
        <div className="flex flex-col items-center pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)' }}>
          <div className="w-20 h-20 bg-[hsl(165,35%,45%)] rounded-full flex items-center justify-center mb-4">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-[hsl(165,40%,25%)] italic">
            Invalid Link
          </h1>
          <p className="text-[hsl(165,30%,35%)] text-sm mt-1 text-center px-4">
            This password reset link is invalid or has expired.
          </p>
        </div>

        <div className="flex-1 px-4">
          <Card className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-lg text-center">
            <p className="text-muted-foreground text-sm mb-4">
              Please request a new password reset link.
            </p>
            <Link to="/forgot-password">
              <Button className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-semibold">
                Request New Link
              </Button>
            </Link>
            <Link
              to="/me"
              className="flex items-center justify-center gap-2 text-sm text-[hsl(165,40%,45%)] hover:underline mt-4"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[hsl(165,35%,55%)] via-[hsl(165,30%,65%)] to-background pb-24">
      {/* Header with Icon */}
      <div className="flex flex-col items-center pb-6" style={{ paddingTop: 'max(env(safe-area-inset-top, 0px), 32px)' }}>
        <div className="w-20 h-20 bg-[hsl(165,35%,45%)] rounded-full flex items-center justify-center mb-4">
          {isSuccess ? (
            <CheckCircle className="w-10 h-10 text-white" />
          ) : (
            <Lock className="w-10 h-10 text-white" />
          )}
        </div>
        <h1 className="text-3xl font-extrabold text-[hsl(165,40%,25%)] italic">
          {isSuccess ? 'Password Updated!' : 'New Password'}
        </h1>
        <p className="text-[hsl(165,30%,35%)] text-sm mt-1 text-center px-4">
          {isSuccess 
            ? 'Redirecting you to sign in...'
            : 'Create a strong password for your account'
          }
        </p>
      </div>

      {/* Form Card */}
      <div className="flex-1 px-4">
        <Card className="w-full max-w-sm mx-auto p-6 rounded-2xl shadow-lg">
          {isSuccess ? (
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-[hsl(165,35%,40%)]">
                  <Lock className="w-4 h-4" />
                  New Password
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border-[hsl(45,25%,80%)] bg-white h-12 pr-10"
                    autoComplete="new-password"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password strength indicator */}
                {password.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: passwordStrength.width }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{passwordStrength.label}</p>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-[hsl(165,35%,40%)]">
                  <Lock className="w-4 h-4" />
                  Confirm Password
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="rounded-xl border-[hsl(45,25%,80%)] bg-white h-12 pr-10"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password match indicator */}
                {confirmPassword.length > 0 && (
                  <p className={`text-xs ${password === confirmPassword ? 'text-green-600' : 'text-red-500'}`}>
                    {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full rounded-xl h-12 bg-primary hover:bg-primary/90 text-white font-semibold text-base"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update Password'}
              </Button>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

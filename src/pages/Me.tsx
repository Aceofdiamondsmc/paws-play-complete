import { useState } from 'react';
import { User, Dog, Settings, LogOut, Mail, Lock, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Me() {
  const { user, profile, dogs, signIn, signUp, signOut, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password);

      if (error) {
        toast.error(error.message);
      } else if (!isLogin) {
        toast.success('Check your email to confirm your account!');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <Dog className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">Paws Play Repeat</h1>
            <p className="text-muted-foreground text-sm mt-1">
              {isLogin ? 'Welcome back!' : 'Join the pack!'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 rounded-full"
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full rounded-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-medium hover:underline"
            >
              {isLogin ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Profile</h1>
          <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-white/20">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
        <div className="flex items-center gap-4">
          <Avatar className="w-20 h-20 ring-4 ring-white/30">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-white text-primary text-2xl">
              {profile?.display_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{profile?.display_name || 'Pet Parent'}</h2>
            <p className="text-primary-foreground/80 text-sm">{user.email}</p>
            {profile?.city && profile?.state && (
              <p className="text-primary-foreground/60 text-sm mt-1">
                📍 {profile.city}, {profile.state}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 -mt-10 space-y-4">
        {/* My Dogs Section */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold flex items-center gap-2">
              <Dog className="w-5 h-5 text-primary" />
              My Dogs
            </h3>
            <Button size="sm" variant="outline" className="rounded-full">
              <Plus className="w-4 h-4 mr-1" />
              Add Dog
            </Button>
          </div>
          {dogs.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Dog className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Add your first pup to get started!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dogs.map(dog => (
                <div key={dog.id} className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={dog.avatar_url || undefined} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {dog.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-semibold">{dog.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {dog.breed} • {dog.size}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Parks Visited</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Friends</p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">0</p>
            <p className="text-xs text-muted-foreground">Playdates</p>
          </Card>
        </div>

        {/* Sign Out */}
        <Button 
          variant="outline" 
          className="w-full rounded-full mt-4"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}

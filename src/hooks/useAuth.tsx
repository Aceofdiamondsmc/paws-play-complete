import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import type { Profile, Dog } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  dogs: Dog[];
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signInWithApple: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshDogs: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile (session may have expired):', error);
      setProfile(null);
      return;
    }
    
    if (data) {
      setProfile(data as Profile);
    }
  };

  const fetchDogs = async (userId: string) => {
    const { data, error } = await supabase
      .from('dogs')
      .select('*')
      .eq('owner_id', userId);
    
    if (error) {
      console.error('Error fetching dogs (session may have expired):', error);
      setDogs([]);
      return;
    }
    
    if (data) {
      setDogs(data as Dog[]);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const refreshDogs = async () => {
    if (user) {
      await fetchDogs(user.id);
    }
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Defer profile fetch to avoid deadlock
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchDogs(session.user.id);
            
            // Link OneSignal identity on every auth state change
            if ((window as any).OneSignalDeferred) {
              (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
                try {
                  await OneSignal.login(session.user.id);
                  console.log('OneSignal identity linked on auth');
                } catch (e) {
                  console.log('OneSignal login skipped (not initialized or declined)');
                }
              });
            }
          }, 0);
        } else {
          setProfile(null);
          setDogs([]);
          // Unlink OneSignal identity on logout to prevent cross-user notifications
          if ((window as any).OneSignalDeferred) {
            (window as any).OneSignalDeferred.push(async (OneSignal: any) => {
              try {
                await OneSignal.logout();
                console.log('OneSignal: identity unlinked on sign out');
              } catch (e) {
                console.log('OneSignal logout skipped');
              }
            });
          }
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      if (session?.user) {
        fetchProfile(session.user.id);
        fetchDogs(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string) => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const redirectUrl = isNative
      ? 'com.pawsplayrepeat.app://callback'
      : `${window.location.origin}/me`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signInWithGoogle = async () => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const redirectUrl = isNative
      ? 'com.pawsplayrepeat.app://callback'
      : `${window.location.origin}/me`;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: { prompt: 'select_account' },
        skipBrowserRedirect: isNative,
      }
    });

    if (isNative && data?.url) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: data.url, presentationStyle: 'popover' });
    }

    return { error };
  };

  const signInWithApple = async () => {
    const isNative = !!(window as any).Capacitor?.isNativePlatform?.();
    const redirectUrl = isNative
      ? 'com.pawsplayrepeat.app://callback'
      : `${window.location.origin}/me`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'apple',
      options: {
        redirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setDogs([]);
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      profile,
      dogs,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signInWithApple,
      signOut,
      refreshProfile,
      refreshDogs
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

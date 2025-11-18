'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase-client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any; data?: any }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: any }>;
  updatePassword: (newPassword: string) => Promise<{ error: any }>;
  signInWithOTP: (email: string) => Promise<{ error: any }>;
  verifyOTP: (email: string, token: string) => Promise<{ error: any }>;
  enrollMFA: () => Promise<{ error: any; data?: any }>;
  verifyMFAEnrollment: (code: string) => Promise<{ error: any }>;
  unenrollMFA: (factorId: string) => Promise<{ error: any }>;
  verifyMFAChallenge: (factorId: string, code: string) => Promise<{ error: any }>;
  getMFAFactors: () => Promise<{ error: any; data?: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    // Use environment variable for production, fallback to window.location.origin for development
    const redirectUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl ? `${redirectUrl}/auth/callback` : undefined,
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPassword = async (email: string) => {
    const redirectUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl ? `${redirectUrl}/auth/reset-password` : undefined,
    });
    return { error };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error };
  };

  const signInWithOTP = async (email: string) => {
    const redirectUrl =
      process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl ? `${redirectUrl}/auth/callback` : undefined,
      },
    });
    return { error };
  };

  const verifyOTP = async (email: string, token: string) => {
    const { error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });
    return { error };
  };

  // MFA Methods
  const enrollMFA = async () => {
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
    });
    return { data, error };
  };

  const verifyMFAEnrollment = async (code: string) => {
    const factors = await supabase.auth.mfa.listFactors();
    if (factors.data && factors.data.totp && factors.data.totp.length > 0) {
      const factorId = factors.data.totp[0].id;
      const { error } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code,
      });
      return { error };
    }
    return { error: new Error('No MFA factor found') };
  };

  const unenrollMFA = async (factorId: string) => {
    const { error } = await supabase.auth.mfa.unenroll({
      factorId,
    });
    return { error };
  };

  const verifyMFAChallenge = async (factorId: string, code: string) => {
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });
    return { error };
  };

  const getMFAFactors = async () => {
    const { data, error } = await supabase.auth.mfa.listFactors();
    return { data, error };
  };

  const value = {
    user,
    session,
    loading: !mounted || loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    signInWithOTP,
    verifyOTP,
    enrollMFA,
    verifyMFAEnrollment,
    unenrollMFA,
    verifyMFAChallenge,
    getMFAFactors,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

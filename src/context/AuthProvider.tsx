'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthError = {
  message: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  // Combined function to send OTP for both new and existing users
  sendOtp: (email: string, name?: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, otp: string, name?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get session from storage
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sends OTP. Creates user if they don't exist, otherwise sends OTP for login.
  const sendOtp = async (email: string, name?: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: true,
        data: name ? { name } : undefined,
        emailRedirectTo: window.location.origin,
        // Note: Supabase doesn't support customizing the email subject directly
        // The name will be stored in user metadata and used after verification
      },
    });
    return { error: error as AuthError | null };
  };

  // Verifies the OTP for both signup and login.
  const verifyOtp = async (email: string, otp: string, name?: string) => {
    try {
      const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email', // Standard type for email OTP verification
      });

      if (verifyError) {
        return { error: verifyError as AuthError };
      }

      if (!verifyData.session || !verifyData.user) {
        return { error: { message: 'OTP verified, but no session created. Please try again.' } as AuthError };
      }
      
      // If this is a new sign-up and name is provided, update the user's metadata
      if (name && verifyData.user && !verifyData.user.user_metadata?.name) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name }
        });
        
        if (updateError) {
          console.error('Failed to update user name:', updateError);
        }
      }
      
      // Session is established by verifyOtp itself
      return { error: null };
    } catch (error) {
      return { error: { message: String(error) } as AuthError };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    user,
    session,
    isLoading,
    sendOtp,
    verifyOtp,
    signOut,
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
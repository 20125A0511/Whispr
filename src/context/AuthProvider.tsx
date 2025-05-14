'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/utils/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthError = {
  message: string;
};

// Store pending registration info
type PendingRegistration = {
  email: string;
  name?: string;
  timestamp: number;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  sendOtp: (email: string, name?: string) => Promise<{ error: AuthError | null }>;
  verifyOtp: (email: string, otp: string, name?: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage key for pending registration
const PENDING_REGISTRATION_KEY = 'whispr_pending_registration';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Track potential new users (loaded from localStorage)
  const [pendingRegistration, setPendingRegistration] = useState<PendingRegistration | null>(null);

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

    // Load any pending registration from localStorage
    try {
      const savedRegistration = localStorage.getItem(PENDING_REGISTRATION_KEY);
      if (savedRegistration) {
        const parsed = JSON.parse(savedRegistration) as PendingRegistration;
        
        // Only use it if it's less than 10 minutes old
        const isRecent = (Date.now() - parsed.timestamp) < 10 * 60 * 1000;
        if (isRecent) {
          setPendingRegistration(parsed);
        } else {
          // Clean up expired registration
          localStorage.removeItem(PENDING_REGISTRATION_KEY);
        }
      }
    } catch (e) {
      console.error('Error loading pending registration:', e);
      localStorage.removeItem(PENDING_REGISTRATION_KEY);
    }

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Generate and send OTP for user
  const sendOtp = async (email: string, name?: string) => {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true, // allow new users to sign up
          data: name ? { name } : undefined,
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        console.error('Supabase signInWithOtp error in sendOtp:', error.message, error);
        return { error };
      }
      
      const registration: PendingRegistration = {
        email,
        name,
        timestamp: Date.now(),
      };
      
      setPendingRegistration(registration);
      localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(registration));
      
      return { error: null };
    } catch (error) {
      console.error('Unexpected error in sendOtp catch block:', error);
      return { error: { message: String(error) } as AuthError };
    }
  };
  
  // Verify OTP and only create the user account after successful verification
  const verifyOtp = async (email: string, otp: string, name?: string) => {
    try {
      const isPendingRegistration = pendingRegistration?.email?.toLowerCase() === email.toLowerCase();
      const registrationName = name || pendingRegistration?.name;
      
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      
      if (verifyError) {
        if (verifyError.message === "Token has expired or is invalid") {
          return { 
            error: { 
              message: "The verification code is incorrect or has expired. Please try again or request a new code." 
            } as AuthError 
          };
        }
        return { error: verifyError };
      }
      
      if (!data.session || !data.user) {
        return { error: { message: "Authentication failed: No session established" } as AuthError };
      }
      
      // User is now verified. Mark user as verified in metadata
      if (data.user) {
        const currentMeta = data.user.user_metadata || {};
        if (!currentMeta.is_verified) {
          const { error: updateVerifiedError } = await supabase.auth.updateUser({
            data: { ...currentMeta, is_verified: true, name: registrationName }
          });
          if (updateVerifiedError) {
            console.error("Error updating user metadata to set is_verified:", updateVerifiedError);
          }
        }
      }
      
      if (isPendingRegistration) {
        setPendingRegistration(null);
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
      }
      
      setSession(data.session);
      setUser(data.user);
      
      return { error: null };
    } catch (error) {
      console.error('Error in verifyOtp:', error);
      return { error: { message: String(error) } as AuthError };
    }
  };
  
  // Helper function to generate a secure password for users
  const generateSecurePassword = () => {
    const length = 24;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setPendingRegistration(null);
    localStorage.removeItem(PENDING_REGISTRATION_KEY);
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
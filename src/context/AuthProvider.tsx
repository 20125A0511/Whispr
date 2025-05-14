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
      // Generate and send OTP with user creation set to FALSE initially
      // We will only create the user after successful OTP verification
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // Don't create user at this stage
          // Store the user's name for later use (only if not an existing user)
          data: name ? { name } : undefined,
          emailRedirectTo: window.location.origin,
        },
      });
      
      if (error) {
        return { error };
      }
      
      // Store the registration attempt in localStorage
      const registration: PendingRegistration = {
        email,
        name,
        timestamp: Date.now(),
      };
      
      // Update state and localStorage
      setPendingRegistration(registration);
      localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify(registration));
      
      return { error: null };
    } catch (error) {
      console.error('Error in sendOtp:', error);
      return { error: { message: String(error) } as AuthError };
    }
  };
  
  // Verify OTP and only create the user account after successful verification
  const verifyOtp = async (email: string, otp: string, name?: string) => {
    try {
      // Check if we have a pending registration for this email
      const isNewRegistration = pendingRegistration?.email?.toLowerCase() === email.toLowerCase();
      const registrationName = name || pendingRegistration?.name;
      
      // Verify the OTP
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });
      
      if (verifyError) {
        if (verifyError.message === "Token has expired or is invalid") {
          console.error("Invalid OTP entered:", verifyError.message);
          return { 
            error: { 
              message: "The verification code is incorrect or has expired. Please try again or request a new code." 
            } as AuthError 
          };
        }
        
        console.error("OTP verification error:", verifyError);
        return { error: verifyError };
      }
      
      if (!data.session) {
        console.error("No session established after OTP verification");
        return { error: { message: "Authentication failed: No session established" } as AuthError };
      }
      
      // If this is a new user, we need to manually create their account now
      if (isNewRegistration) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password: generateSecurePassword(), // Generate a secure random password
          options: {
            data: { name: registrationName },
            // This ensures the session from verifyOtp is used and not a new one
            // However, this might require re-auth after this signup.
            // Test carefully. Supabase might have issues with verifyOtp then immediate signUp.
          }
        });
        
        if (signUpError) {
          console.error("Error creating user account:", signUpError);
          // If user already exists, this is not a critical failure, as they might have signed up before
          if (!signUpError.message.includes("User already registered")) {
            return { error: signUpError };
          }
        }
      } 
      // If the user exists and we need to update their metadata
      else if (registrationName && data.user) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { name: registrationName }
        });
        
        if (updateError) {
          console.error("Error updating user metadata:", updateError);
          // Non-fatal error, continue with authentication
        }
      }
      
      // Clear the pending registration
      if (isNewRegistration) {
        setPendingRegistration(null);
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
      }
      
      // Ensure the session is properly set in state
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
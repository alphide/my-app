'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

// Create a default context value
const defaultContextValue: AuthContextType = {
  user: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => { return null; },
  signInWithGoogle: async () => {},
  signInWithMicrosoft: async () => {},
  signOut: async () => {},
  refreshSession: async () => {},
};

const AuthContext = createContext<AuthContextType>(defaultContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  // Add a function to refresh the session
  const refreshSession = async () => {
    try {
      console.log('Refreshing session in AuthContext');
      const { data, error } = await supabase.auth.refreshSession();
      if (error) {
        console.error('Session refresh failed:', error);
        // Only update user state if it's actually different to avoid unnecessary rerenders
        if (user !== null) {
          setUser(null);
        }
        // Redirect to login if session can't be refreshed - but only on actual session errors
        // not just when switching tabs
        if (window.location.pathname !== '/' && 
            !window.location.pathname.startsWith('/login') && 
            !window.location.pathname.startsWith('/signup') &&
            error.message !== 'Failed to fetch') {
          router.push('/login');
        }
      } else if (data.user) {
        // Only update if the user data is different
        const currentId = user?.id;
        const newId = data.user?.id;
        
        if (currentId !== newId || JSON.stringify(user) !== JSON.stringify(data.user)) {
          console.log('User state updated');
          setUser(data.user);
        } else {
          console.log('User state unchanged, avoiding rerender');
        }
      }
    } catch (error) {
      console.error('Session refresh error:', error);
      // Only set to null if not already null
      if (user !== null) {
        setUser(null);
      }
    }
  };

  useEffect(() => {
    setMounted(true);
    
    // Check for existing session
    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_OUT') {
        setUser(null);
        // We're not clearing preferredRole on sign out so it persists
        // localStorage.removeItem('preferredRole');
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setUser(session?.user ?? null);
        
        // If user signed in, check if they already have a role in the database
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const { data, error } = await supabase
              .from('users')
              .select('role')
              .eq('id', session.user.id)
              .maybeSingle();
              
            if (error) {
              console.error('Error fetching user role on sign in:', error);
            } else if (data?.role) {
              console.log('Found existing role on sign in:', data.role);
              localStorage.setItem('preferredRole', data.role);
            }
          } catch (error) {
            console.error('Failed to check existing role on sign in:', error);
          }
        }
      }
      
      setLoading(false);
    });

    // Set up periodic session refresh (every 10 minutes)
    const refreshInterval = setInterval(() => {
      refreshSession();
    }, 10 * 60 * 1000); // 10 minutes

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth check failed:', error);
        setUser(null);
        return;
      }
      
      if (!session) {
        setUser(null);
        return;
      }
      
      // Check if session is expired or close to expiring
      const expiresAt = session.expires_at;
      if (!expiresAt) {
        // If no expiration, refresh the session to be safe
        await refreshSession();
        return;
      }
      
      const now = Math.floor(Date.now() / 1000);
      const timeLeft = expiresAt - now;
      
      // If less than 5 minutes left or already expired, refresh the session
      if (timeLeft < 300) {
        await refreshSession();
      } else {
        setUser(session.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) throw error;
      
      // Set user state
      setUser(data.user);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // Perform the signup - Supabase will return an error if the email already exists
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      const emailConfirmationRequired = data?.user && !data?.session;
      
      // We only try to insert a user record if:
      // 1. Email confirmation is not required (user is already confirmed), OR
      // 2. We're setting up a user who is already confirmed
      //
      // For users requiring email confirmation, the database trigger in email-verification.sql
      // will create their user record when their email is confirmed
      if (!emailConfirmationRequired && data.user) {
        try {
          // Create minimal user record
          const { error: insertError } = await supabase
            .from('users')
            .insert([
              { 
                id: data.user.id,
                email: email,
              },
            ]);
          
          if (insertError) {
            console.error('Error creating user record:', insertError);
            // We continue even if there's an error creating the user record
            // The user can still log in, and we'll try to create the record again later
          }
        } catch (insertError) {
          console.error('Exception creating user record:', insertError);
          // Continue even if there's an error
        }
      }

      // Only set user if email confirmation is not required
      if (!emailConfirmationRequired) {
        setUser(data.user);
      }

      return data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    if (!mounted) return;
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Google login failed:', error);
      throw error;
    }
  };

  const signInWithMicrosoft = async () => {
    if (!mounted) return;
    
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
        },
      });

      if (error) throw error;
    } catch (error) {
      console.error('Microsoft login failed:', error);
      throw error;
    }
  };

  const signOut = async () => {
    if (!mounted) return;
    
    try {
      // Save current role preference before signing out
      const currentRole = localStorage.getItem('preferredRole');
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Don't clear the preferredRole, so it persists across logins
      // Instead, restore it after sign out
      if (currentRole) {
        localStorage.setItem('preferredRole', currentRole);
      }
      
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signInWithMicrosoft,
        signOut,
        refreshSession,
      }}
    >
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
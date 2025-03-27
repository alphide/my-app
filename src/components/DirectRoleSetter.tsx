'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface DirectRoleSetterProps {
  userId: string;
  email: string;
  role: 'submitter' | 'reviewer';
  onSuccess?: (role: string) => void;
  onError?: (error: any) => void;
}

/**
 * A helper component that attempts to directly set a user's role in the database
 * from the client side as a fallback mechanism when the API route fails.
 */
export default function DirectRoleSetter({ userId, email, role, onSuccess, onError }: DirectRoleSetterProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId || !email || !role) {
      return;
    }

    const setUserRole = async () => {
      try {
        setStatus('loading');
        
        // First check if the user already exists
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (checkError) {
          console.error('Error checking user existence:', checkError);
          throw checkError;
        }

        let result;
        if (existingUser) {
          // Update existing user
          result = await supabase
            .from('users')
            .update({ role })
            .eq('id', userId);
        } else {
          // Insert new user
          result = await supabase
            .from('users')
            .insert({
              id: userId,
              email,
              role,
              password_hash: 'auth_managed' // Auth handles the real password
            });
        }

        if (result.error) {
          console.error('Error setting role directly:', result.error);
          throw result.error;
        }

        console.log('Role set directly in database:', role);
        setStatus('success');
        if (onSuccess) onSuccess(role);
      } catch (error: any) {
        console.error('Failed to set role directly:', error);
        setStatus('error');
        setError(error.message || 'Unknown error');
        if (onError) onError(error);
      }
    };

    setUserRole();
  }, [userId, email, role, onSuccess, onError]);

  return null; // This is a headless component, doesn't render anything
} 
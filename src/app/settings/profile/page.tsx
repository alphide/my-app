'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

interface UserProfile {
  id: string;
  display_name: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

export default function ProfileSettings() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, display_name, username, email, role, created_at')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          return;
        }

        if (data) {
          setProfile(data);
          setDisplayName(data.display_name || '');
          setUsername(data.username || '');
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');
    setSuccess('');

    if (!displayName.trim()) {
      setError('Display name is required');
      setIsSaving(false);
      return;
    }

    if (!username.trim()) {
      setError('Username is required');
      setIsSaving(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      setIsSaving(false);
      return;
    }

    try {
      // Check if the username is already taken by another user
      if (username !== profile?.username) {
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.toLowerCase())
          .neq('id', user?.id || '')
          .single();

        if (existingUser) {
          setError('Username is already taken. Please choose another one.');
          setIsSaving(false);
          return;
        }

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows returned, which is what we want
          throw checkError;
        }
      }

      // Update user information
      const { error: updateError } = await supabase
        .from('users')
        .update({
          display_name: displayName.trim(),
          username: username.trim().toLowerCase(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id || '');

      if (updateError) {
        throw updateError;
      }

      setSuccess('Profile updated successfully!');
      
      // Update local state with new values
      if (profile) {
        setProfile({
          ...profile,
          display_name: displayName.trim(),
          username: username.trim().toLowerCase()
        });
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center group">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
              Vett
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 focus:outline-none nav-link"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>Profile</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 focus:outline-none nav-link"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>
        
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">User Information</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your account details</p>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 p-3 bg-green-50 text-green-700 rounded-md">
                  {success}
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                    />
                    <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="display_name" className="block text-sm font-medium text-gray-700">
                    Display Name
                  </label>
                  <div className="mt-1">
                    <input
                      id="display_name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Your name"
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="mt-1">
                    <input
                      id="username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="username"
                    />
                    <p className="mt-1 text-xs text-gray-500">Only letters, numbers, and underscores</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Role
                  </label>
                  <div className="mt-1">
                    <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {profile?.role === 'reviewer' ? 'Reviewer' : 'Profile Submitter'}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Your role can be changed on the dashboard
                    </p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Account Created
                  </label>
                  <div className="mt-1">
                    <div className="px-4 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-700">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : ''}
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                  >
                    Cancel
                  </Link>
                  
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
              
              <div className="mt-8 pt-6 border-t border-gray-200">
                <h3 className="text-md font-medium text-gray-700 mb-4">Additional Actions</h3>
                
                {profile?.role === 'submitter' && (
                  <Link
                    href="/submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                  >
                    Update Dating Profile
                  </Link>
                )}
                
                {profile?.role === 'submitter' && (
                  <Link
                    href="/my-reviews"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    View My Reviews
                  </Link>
                )}
                
                {profile?.role === 'reviewer' && (
                  <Link
                    href="/review"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Review Profiles
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
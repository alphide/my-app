'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ProfileSettings() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState({
    displayName: '',
    email: user?.email || '',
    bio: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const fetchUserData = async () => {
      try {
        // First check localStorage for role as a fast source
        const localRole = localStorage.getItem('preferredRole');
        if (localRole === 'submitter' || localRole === 'reviewer') {
          setUserRole(localRole);
        }
        
        // Then fetch the user data from the database (without using .single())
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id);

        if (error) {
          console.error('Error fetching user data:', error);
          return;
        }

        // Check if we got any data
        if (data && data.length > 0) {
          const userData = data[0];
          setUserRole(userData.role);
          setUserProfile({
            displayName: userData.display_name || '',
            email: user.email || '',
            bio: userData.bio || '',
          });
          
          // Update localStorage
          if (userData.role) {
            localStorage.setItem('preferredRole', userData.role);
          }
        } else {
          console.log('No user data found, using defaults');
        }
      } catch (error) {
        console.error('Error in fetchUserData:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // First check if the user already exists
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user?.id);
        
      if (checkError) {
        console.error('Error checking if user exists:', checkError);
        throw checkError;
      }
      
      let operation;
      if (existingUser && existingUser.length > 0) {
        // Update existing user
        operation = supabase
          .from('users')
          .update({
            display_name: userProfile.displayName,
            bio: userProfile.bio,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user?.id);
      } else {
        // Insert new user with the role from localStorage
        const role = localStorage.getItem('preferredRole') || 'submitter';
        operation = supabase
          .from('users')
          .insert({
            id: user?.id,
            email: user?.email,
            display_name: userProfile.displayName,
            bio: userProfile.bio,
            role: role,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });
      }
      
      // Execute the operation
      const { error } = await operation;
      
      if (error) throw error;
      setSuccessMessage('Profile updated successfully!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      setErrorMessage('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
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
        
        {successMessage && (
          <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}
        
        {errorMessage && (
          <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
            {errorMessage}
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Personal Information</h2>
            <p className="mt-1 text-sm text-gray-500">Update your profile information</p>
          </div>
          
          <div className="border-t border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={userProfile.email}
                    disabled
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md bg-gray-50"
                  />
                  <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
                </div>
              </div>
              
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700">
                  Display Name
                </label>
                <div className="mt-1">
                  <input
                    type="text"
                    id="displayName"
                    name="displayName"
                    value={userProfile.displayName}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Your display name"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
                  Bio
                </label>
                <div className="mt-1">
                  <textarea
                    id="bio"
                    name="bio"
                    rows={4}
                    value={userProfile.bio}
                    onChange={handleChange}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="A short bio about yourself"
                  />
                </div>
              </div>
              
              <div className="flex justify-end">
                <Link
                  href="/dashboard"
                  className="mr-4 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="mt-12 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Account</h2>
            <p className="mt-1 text-sm text-gray-500">Manage your account settings</p>
          </div>
          
          <div className="border-t border-gray-200">
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700">Account Type</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {userRole === 'submitter' ? 'Profile Submitter' : 'Profile Reviewer'}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-700">Change Password</h3>
                <Link 
                  href="/settings/password"
                  className="mt-1 inline-flex items-center text-sm text-primary hover:text-primary/80"
                >
                  Update password
                  <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
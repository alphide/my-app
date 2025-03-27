'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';
import Header from '@/components/Header';

interface FormData {
  displayName: string;
  username: string;
  profileImage: File | null;
}

export default function ProfileSetup() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    displayName: '',
    username: '',
    profileImage: null
  });

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if user already has a username and display name
    const checkUserProfile = async () => {
      try {
        // Using auth client to ensure RLS policies are respected
        const { data: session } = await supabase.auth.getSession();
        
        const { data, error } = await supabase
          .from('users')
          .select('role, display_name, username, profile_image_url')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error checking user profile:', error);
          setError('Failed to load your profile information');
          setLoading(false);
          return;
        }
        
        const role = data?.role || localStorage.getItem('preferredRole');
        setUserRole(role);

        // If user already has a display name and username, redirect to dashboard
        if (data && data.display_name && data.username) {
          console.log('User already has a profile, redirecting to dashboard');
          router.push('/dashboard');
          return;
        }

        // Pre-fill form with any existing data
        setFormData({
          ...formData,
          displayName: data?.display_name || '',
          username: data?.username || ''
        });

        // If there's a profile image, show it
        if (data?.profile_image_url) {
          setImagePreview(data.profile_image_url);
        }

        setLoading(false);
      } catch (error) {
        console.error('Error:', error);
        setLoading(false);
      }
    };

    checkUserProfile();
  }, [user, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Image must be less than 5MB');
        return;
      }
      
      setFormData({
        ...formData,
        profileImage: file
      });
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      
      setError(null);
    }
  };

  const validateForm = () => {
    // Display name validation
    if (!formData.displayName.trim()) {
      setError('Display name is required');
      return false;
    }
    
    if (formData.displayName.length < 2) {
      setError('Display name must be at least 2 characters');
      return false;
    }
    
    // Username validation
    if (!formData.username.trim()) {
      setError('Username is required');
      return false;
    }
    
    if (formData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    
    // Username format validation (letters, numbers, underscores only)
    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    
    return true;
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setError(null);
    setSubmitting(true);
    
    try {
      if (!user) {
        setError('You must be logged in to update your profile');
        setSubmitting(false);
        return;
      }

      // Get current session for authenticated requests
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData.session) {
        setError('Your session has expired. Please log in again.');
        setSubmitting(false);
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      // Check if username is already taken
      const { data: usernameCheck, error: usernameError } = await supabase
        .from('users')
        .select('id')
        .eq('username', formData.username)
        .neq('id', user.id)
        .single();
        
      if (usernameError && usernameError.code !== 'PGRST116') {
        // PGRST116 means no rows returned, which is what we want
        console.error('Error checking username:', usernameError);
        setError('Error checking username availability');
        setSubmitting(false);
        return;
      }
      
      if (usernameCheck) {
        setError('Username is already taken');
        setSubmitting(false);
        return;
      }
      
      // Upload image if one was selected
      let profileImageUrl = null;
      
      if (formData.profileImage) {
        const fileExt = formData.profileImage.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('profile-images')
          .upload(fileName, formData.profileImage);
          
        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setError('Failed to upload profile image');
          setSubmitting(false);
          return;
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase
          .storage
          .from('profile-images')
          .getPublicUrl(fileName);
          
        profileImageUrl = publicUrlData.publicUrl;
      }
      
      // Try a simple update first since the user record should already exist
      const updateData: any = {
        display_name: formData.displayName,
        username: formData.username
      };
      
      if (profileImageUrl) {
        updateData.profile_image_url = profileImageUrl;
      }
      
      if (userRole) {
        updateData.role = userRole;
      }
      
      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', user.id);
        
      if (updateError) {
        console.error('Error updating profile with standard update:', updateError);
        
        // If update fails, try an upsert as fallback
        const upsertData = {
          id: user.id,
          email: user.email,
          ...updateData
        };
        
        const { error: upsertError } = await supabase
          .from('users')
          .upsert(upsertData, {
            onConflict: 'id'
          });
          
        if (upsertError) {
          console.error('Error upserting profile as fallback:', upsertError);
          setError('Failed to update profile. Please try again.');
          setSubmitting(false);
          return;
        }
      }
      
      setSuccess('Profile updated successfully!');
      
      // Save role to localStorage for persistence
      if (userRole) {
        localStorage.setItem('preferredRole', userRole);
      }
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
      
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setError(error.message || 'An unexpected error occurred');
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="profile" />
      
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Profile</h1>
          <p className="text-gray-600 mb-6">
            Add some personal details to make your profile more recognizable. This information will be visible to other users.
          </p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-6 p-3 bg-green-50 text-green-700 rounded-md">
              {success}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name*
              </label>
              <input
                type="text"
                name="displayName"
                value={formData.displayName}
                onChange={handleInputChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                placeholder="e.g. John Smith"
              />
              <p className="mt-1 text-sm text-gray-500">This will be displayed on your profile and reviews</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username*
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="e.g. john_smith"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">Letters, numbers, and underscores only</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Profile Image (Optional)
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0">
                  <div className="relative h-24 w-24 rounded-full overflow-hidden bg-gray-100 border border-gray-300">
                    {imagePreview ? (
                      <Image 
                        src={imagePreview} 
                        alt="Profile preview" 
                        fill 
                        className="object-cover"
                        unoptimized={imagePreview.startsWith('data:') || imagePreview.includes('unsplash.com')}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex-grow">
                  <label className="block">
                    <span className="sr-only">Choose profile photo</span>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-medium
                        file:bg-gray-100 file:text-gray-700
                        hover:file:bg-gray-200"
                    />
                  </label>
                  <p className="mt-1 text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={handleSkip}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Skip for Now
              </button>
              
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-primary border border-transparent rounded-md shadow-sm hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </span>
                ) : (
                  'Save Profile'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 
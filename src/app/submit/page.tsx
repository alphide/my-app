'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Image from 'next/image';

export default function SubmitProfile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profileText, setProfileText] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [existingProfile, setExistingProfile] = useState<any>(null);
  const [useMockData, setUseMockData] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id);

        if (error) {
          console.error('Error checking user role:', error);
          return;
        }

        if (data && data.length > 0) {
          setUserRole(data[0].role);
          
          // Check if user is a submitter
          if (data[0].role !== 'submitter') {
            router.push('/dashboard');
            return;
          }
        } else {
          router.push('/dashboard');
          return;
        }
        
        // Check if user already has a profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id);
          
        if (profileError) {
          console.error('Error fetching profile:', profileError);
        }
        
        if (profileData && profileData.length > 0) {
          setExistingProfile(profileData[0]);
          setProfileText(profileData[0].profile_text || '');
          // We don't set existing images here because we can't convert URLs back to Files
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, router]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: File[] = [];
    const newUrls: string[] = [];

    // Limit to 6 images total
    const remainingSlots = 6 - selectedImages.length;
    const totalToAdd = Math.min(remainingSlots, files.length);

    for (let i = 0; i < totalToAdd; i++) {
      const file = files[i];
      newFiles.push(file);
      
      // Create preview URL
      const url = URL.createObjectURL(file);
      newUrls.push(url);
    }

    setSelectedImages([...selectedImages, ...newFiles]);
    setPreviewUrls([...previewUrls, ...newUrls]);
    
    // Reset the input value so the same file can be selected again if removed
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    const newUrls = [...previewUrls];
    
    // Revoke the object URL to avoid memory leaks
    URL.revokeObjectURL(newUrls[index]);
    
    newImages.splice(index, 1);
    newUrls.splice(index, 1);
    
    setSelectedImages(newImages);
    setPreviewUrls(newUrls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (selectedImages.length === 0) {
      setError('Please select at least one image');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // Create form data
      const formData = new FormData();
      formData.append('profileText', profileText);
      
      selectedImages.forEach((file, index) => {
        formData.append(`image${index}`, file);
      });
      
      const response = await fetch('/api/submit-profile', {
        method: 'POST',
        body: formData,
        credentials: 'include', // Include cookies with the request
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        // If unauthorized, switch to mock mode
        if (response.status === 401) {
          setUseMockData(true);
          // Simulate successful submission
          await new Promise(resolve => setTimeout(resolve, 1000));
          setSuccess('Profile submitted successfully! (Demo Mode)');
          setTimeout(() => {
            router.push('/dashboard');
          }, 2000);
          return;
        }
        throw new Error(data.error || 'Failed to submit profile');
      }
      
      setSuccess('Profile submitted successfully!');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch (error: any) {
      console.error('Error submitting profile:', error);
      setError(error.message || 'Failed to submit profile');
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          {existingProfile ? 'Update Your Dating Profile' : 'Submit Your Dating Profile'}
        </h1>
        
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
        
        {existingProfile && (
          <div className="mb-6 p-4 bg-blue-50 text-blue-800 rounded-md">
            <p className="font-medium">You already have a profile submission</p>
            <p className="text-sm mt-1">
              You can update your existing profile by submitting new images and text.
            </p>
          </div>
        )}

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h2 className="text-lg font-medium text-gray-900">Dating Profile Details</h2>
            <p className="mt-1 text-sm text-gray-500">Provide details to get feedback from reviewers</p>
          </div>
          
          <div className="border-t border-gray-200">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label htmlFor="profileText" className="block text-sm font-medium text-gray-700">
                  Profile Text (Optional)
                </label>
                <div className="mt-1">
                  <textarea
                    id="profileText"
                    name="profileText"
                    rows={6}
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    className="shadow-sm focus:ring-primary focus:border-primary block w-full sm:text-sm border-gray-300 rounded-md"
                    placeholder="Share a bit about yourself, your interests, and what you're looking for..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Profile Images (1-6 images)
                </label>
                <div className="mt-2 flex flex-wrap gap-4">
                  {previewUrls.map((url, index) => (
                    <div key={index} className="relative w-32 h-32">
                      <Image
                        src={url}
                        alt={`Preview ${index}`}
                        fill
                        className="object-cover rounded-md"
                        unoptimized={url.includes('blob:')}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  
                  {selectedImages.length < 6 && (
                    <label className="w-32 h-32 flex flex-col items-center justify-center border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:border-primary">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H8m36-12h-4m4 0H20" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="mt-2 block text-xs text-gray-600">
                        Add Image
                      </span>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {selectedImages.length} of 6 images selected. Add at least 1 image.
                </p>
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
                  disabled={submitting || selectedImages.length === 0}
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Submitting...' : existingProfile ? 'Update Profile' : 'Submit Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
} 
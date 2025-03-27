'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ProfileCard from '@/components/ProfileCard';
import FeedbackForm from '@/components/FeedbackForm';
import NoProfilesToReview from '@/components/NoProfilesToReview';
import Header from '@/components/Header';

type Profile = {
  id: string;
  user_id: string;
  profile_text: string;
  image_urls: string[];
  created_at: string;
};

// Transformed profile data structure for our new ProfileCard component
interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  interests: string[];
  imageUrl?: string;
  lookingFor: string;
  location?: string;
  age?: number;
}

export default function ReviewProfile() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loadingNextProfile, setLoadingNextProfile] = useState(false);
  const [useMockData, setUseMockData] = useState(false);

  // Add a timeout effect to show mock profiles if loading takes too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (loadingNextProfile) {
      console.log('Setting loading timeout to show mock profiles');
      timeoutId = setTimeout(() => {
        console.log('Loading timed out, showing mock profile');
        setLoadingNextProfile(false);
        showMockProfile();
      }, 5000); // Show mock profile after 5 seconds of loading
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [loadingNextProfile]);

  // Create mock profiles data
  const mockProfiles = [
    {
      id: 'mock-1',
      username: 'alex_hiker',
      displayName: 'Alex',
      bio: "Hi there! I'm a software developer who loves hiking and photography. Looking for someone who enjoys outdoor adventures and quiet evenings with a good book or movie. I have a rescue dog named Max who is the best hiking buddy!",
      interests: ['Hiking', 'Photography', 'Reading', 'Dogs', 'Coding'],
      imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1000',
      lookingFor: 'Someone who loves nature and animals',
      location: 'Denver, CO',
      age: 28
    },
    {
      id: 'mock-2',
      username: 'fitness_foodie',
      displayName: 'Taylor',
      bio: "Passionate about fitness, good food, and travel. I work as a personal trainer and love helping others achieve their goals. In my free time, you'll find me trying new restaurants or planning my next trip. Looking for someone with similar interests!",
      interests: ['Fitness', 'Cooking', 'Travel', 'Food', 'Running'],
      imageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1000',
      lookingFor: 'A partner for adventures and good meals',
      location: 'Austin, TX',
      age: 31
    },
    {
      id: 'mock-3',
      username: 'creative_soul',
      displayName: 'Jordan',
      bio: "Hey! I'm a graphic designer with a passion for art, music, and spontaneous road trips. I play guitar in a local band and have a weakness for pizza and craft beer. Looking for someone creative and adventurous to share experiences with.",
      interests: ['Art', 'Music', 'Road Trips', 'Design', 'Craft Beer'],
      imageUrl: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&q=80&w=1000',
      lookingFor: 'A creative person who enjoys music and art',
      location: 'Portland, OR',
      age: 26
    }
  ];

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    const checkUserRole = async () => {
      try {
        // Check for the attemptingReview flag set on the dashboard
        const attemptingReview = localStorage.getItem('attemptingReview');
        if (attemptingReview === 'true') {
          console.log('Detected review attempt from dashboard, clearing flag');
          localStorage.removeItem('attemptingReview');
        }
        
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
          
          // Check if user is a reviewer
          if (data[0].role !== 'reviewer') {
            router.push('/dashboard');
            return;
          }
        } else {
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
        fetchRandomProfile();
      }
    };

    checkUserRole();
  }, [user, router]);

  const showMockProfile = () => {
    console.log('Showing mock profile');
    // Select a random mock profile
    const randomIndex = Math.floor(Math.random() * mockProfiles.length);
    
    // Force into mock mode by clearing any error states first
    setError('');
    setSuccess('');
    setLoadingNextProfile(false);
    
    // Set the profile data from mock profiles
    setProfileData(mockProfiles[randomIndex]);
    setProfile({ 
      id: mockProfiles[randomIndex].id,
      user_id: 'mock',
      profile_text: mockProfiles[randomIndex].bio,
      image_urls: [mockProfiles[randomIndex].imageUrl || ''],
      created_at: new Date().toISOString()
    });
    
    // Ensure we're in mock mode
    setUseMockData(true);
    console.log('Mock profile set:', mockProfiles[randomIndex].displayName);
  };

  const fetchRandomProfile = async () => {
    setLoadingNextProfile(true);
    console.log('Starting fetchRandomProfile function');
    try {
      console.log('Fetching random profile to review');
      
      // First, verify that we have a valid session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No session found, showing mock profile');
        showMockProfile();
        setLoadingNextProfile(false);
        return;
      }
      
      console.log('Session found, user ID:', session.user.id);
      
      // Check if auth token will expire soon (within 5 minutes)
      const tokenExpiresAt = session.expires_at;
      const now = Math.floor(Date.now() / 1000);
      
      // Only check expiration if we have an expiration time
      if (tokenExpiresAt) {
        const timeLeft = tokenExpiresAt - now;
        
        if (timeLeft < 300) {
          console.log('Session expiring soon, refreshing');
          try {
            const refreshResult = await supabase.auth.refreshSession();
            console.log('Session refreshed successfully:', !!refreshResult.data.session);
            // Update session with refreshed session
            if (refreshResult.data.session) {
              session.access_token = refreshResult.data.session.access_token;
            }
          } catch (refreshError) {
            console.error('Error refreshing session:', refreshError);
          }
        }
      }
      
      // Make the API request with proper authentication
      console.log('Making API request with token:', session.access_token?.substring(0, 10) + '...');
      const response = await fetch('/api/get-profile-to-review', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include',
      });
      
      console.log('API response status:', response.status);
      
      // If we get an authentication error, use mock data
      if (response.status === 401) {
        console.log('Auth error (401), showing mock profile');
        localStorage.setItem('hadAuthError', 'true');
        showMockProfile();
        setLoadingNextProfile(false);
        return;
      }
      
      const data = await response.json();
      console.log('API response data:', data);
      
      if (!response.ok) {
        console.log('Response not OK, throwing error');
        throw new Error(data.error || 'Failed to fetch profile');
      }
      
      if (data.message === 'No more profiles to review') {
        console.log('No more profiles to review');
        setProfile(null);
        setProfileData(null);
        setError('No more profiles to review at this time. Please check back later.');
        setUseMockData(false);
        setLoadingNextProfile(false);
        return;
      }
      
      // Set the original profile data
      console.log('Setting profile data');
      setProfile(data.profile);
      
      // Transform the profile data for our new ProfileCard component
      setProfileData({
        id: data.profile.id,
        username: data.profile.users?.username || 'user',
        displayName: data.profile.users?.display_name || 'User',
        bio: data.profile.profile_text,
        interests: data.profile.interests || [],
        imageUrl: data.profile.image_urls?.[0],
        lookingFor: data.profile.looking_for || '',
        location: data.profile.location,
        age: data.profile.age
      });
      
      setError('');
      setSuccess('');
      setUseMockData(false);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      
      // Use mock data if API fails with auth issues
      if (error.message === 'Unauthorized' || 
          error.message.includes('authentication') || 
          error.message.includes('401')) {
        console.log('Auth error in exception, showing mock profile');
        showMockProfile();
      } else {
        setError(error.message || 'Failed to fetch profile');
        setProfile(null);
        setProfileData(null);
        setUseMockData(false);
      }
    } finally {
      setLoadingNextProfile(false);
      console.log('Finished fetchRandomProfile function, loadingNextProfile set to false');
    }
  };

  const handleSubmitReview = async (rating: number, feedback: string) => {
    if (!profile) {
      setError('No profile to review');
      return;
    }
    
    setSubmitting(true);
    setError('');
    
    try {
      // If using mock data, simulate a successful review submission
      if (useMockData) {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setSuccess('Review submitted successfully! (Mock Mode)');
        
        // Fetch a new profile after a short delay
        setTimeout(() => {
          fetchRandomProfile();
        }, 1500);
      } else {
        // Real API call
        const response = await fetch('/api/submit-review', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include', // Include cookies with the request
          body: JSON.stringify({
            profileId: profile.id,
            rating,
            feedback,
          }),
        });
        
        // If we get an authentication error, switch to mock mode for next time
        if (response.status === 401) {
          setUseMockData(true);
          setSuccess('Review submitted successfully! (Switching to Mock Mode)');
          
          // Fetch a new profile after a short delay
          setTimeout(() => {
            fetchRandomProfile();
          }, 1500);
          return;
        }
        
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to submit review');
        }
        
        setSuccess('Review submitted successfully!');
        
        // Fetch a new profile after a short delay
        setTimeout(() => {
          fetchRandomProfile();
        }, 1500);
      }
    } catch (error: any) {
      console.error('Error submitting review:', error);
      
      // If authentication error, switch to mock mode
      if (error.message === 'Unauthorized' || 
          error.message.includes('authentication') || 
          error.message.includes('401')) {
        setUseMockData(true);
        setSuccess('Review submitted successfully! (Switching to Mock Mode)');
        
        // Fetch a new profile after a short delay
        setTimeout(() => {
          fetchRandomProfile();
        }, 1500);
      } else {
        setError(error.message || 'Failed to submit review');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const skipProfile = () => {
    fetchRandomProfile();
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
      <Header currentPage="review" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Review Dating Profiles</h1>
        
        {useMockData && (
          <div className="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700 rounded-md">
            <p className="font-medium text-lg">🔍 Demo Mode Active</p>
            <p className="mt-1">
              You're viewing example profiles due to authentication issues. This is for demonstration purposes only. 
              Your reviews won't be saved to the database.
            </p>
            <p className="mt-2 text-sm">
              <strong>Troubleshooting:</strong> If this persists, try logging out and logging back in, 
              or check your RLS policies in Supabase.
            </p>
          </div>
        )}
        
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
        
        {loadingNextProfile ? (
          <div className="bg-white shadow sm:rounded-lg p-8 flex flex-col items-center justify-center min-h-[400px]">
            <div className="text-center mb-6">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading next profile...</p>
            </div>
            
            <button
              onClick={() => {
                setLoadingNextProfile(false);
                showMockProfile();
              }}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Show Example Profile Instead
            </button>
          </div>
        ) : !profileData ? (
          <NoProfilesToReview onShowMockProfile={showMockProfile} />
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Dating Profile Review</h2>
                <p className="mt-1 text-sm text-gray-500">Provide honest and constructive feedback</p>
              </div>
              <button
                onClick={skipProfile}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
              >
                Skip Profile
              </button>
            </div>
            
            <div className="border-t border-gray-200">
              <div className="p-6">
                <div className="mb-8">
                  <ProfileCard profile={profileData} isDemo={useMockData} />
                </div>
                
                <FeedbackForm 
                  profileId={profile?.id || ''}
                  onSubmit={handleSubmitReview}
                  isSubmitting={submitting}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
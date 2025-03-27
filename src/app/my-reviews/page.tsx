'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ReviewCard from '@/components/ReviewCard';
import ReviewAnalytics from '@/components/ReviewAnalytics';

type Review = {
  id: string;
  rating: number;
  feedback: string;
  created_at: string;
  reviewer_name: string;
};

type Analytics = {
  total_rating: number;
  review_count: number;
  average_rating: number;
  rating_distribution: Record<string, number>;
};

export default function MyReviews() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [profileId, setProfileId] = useState<string | null>(null);
  const [useMockData, setUseMockData] = useState(false);

  // Create mock reviews data
  const mockReviews = [
    {
      id: 'mock-rev-1',
      rating: 4,
      feedback: "Great profile! Your photos clearly show your personality and interests. I especially like the hiking photo - it shows you're active and enjoy the outdoors. Your bio is well-written and gives enough detail about who you are. Maybe consider adding a bit more about what you're looking for in a partner.",
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
      reviewer_name: 'Emily',
    },
    {
      id: 'mock-rev-2',
      rating: 5,
      feedback: "Excellent profile! Your photos are high quality and show you in various settings. I like how you've included both close-ups and full-body shots. Your bio is engaging and shows your sense of humor. You come across as genuine and approachable. No suggestions for improvement - well done!",
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
      reviewer_name: 'Sarah',
    },
    {
      id: 'mock-rev-3',
      rating: 3,
      feedback: "Your profile has potential but could use some improvements. The photos are decent but a bit too similar - try adding more variety to show different aspects of your life. Your bio is a good start but feels generic in some places. Consider adding more specific details about your interests and what makes you unique.",
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
      reviewer_name: 'Jessica',
    }
  ];

  // Mock analytics based on mock reviews
  const mockAnalytics = {
    total_rating: mockReviews.reduce((sum, review) => sum + review.rating, 0),
    review_count: mockReviews.length,
    average_rating: mockReviews.reduce((sum, review) => sum + review.rating, 0) / mockReviews.length,
    rating_distribution: {
      "1": mockReviews.filter(r => r.rating === 1).length,
      "2": mockReviews.filter(r => r.rating === 2).length,
      "3": mockReviews.filter(r => r.rating === 3).length,
      "4": mockReviews.filter(r => r.rating === 4).length,
      "5": mockReviews.filter(r => r.rating === 5).length,
    }
  };

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
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
        fetchReviews();
      }
    };

    checkUserRole();
  }, [user, router]);

  const fetchReviews = async () => {
    try {
      const response = await fetch('/api/get-my-reviews', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (response.status === 401) {
        setUseMockData(true);
        setReviews(mockReviews);
        setAnalytics(mockAnalytics);
        setProfileId('mock-profile-id');
        setError('');
        return;
      }
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch reviews');
      }
      
      if (data.message === 'No profile found') {
        setError('You need to submit a profile before you can receive reviews.');
        return;
      }
      
      setReviews(data.reviews || []);
      setAnalytics(data.analytics || null);
      setProfileId(data.profileId || null);
    } catch (error: any) {
      console.error('Error fetching reviews:', error);
      setError(error.message || 'Failed to fetch reviews');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile Reviews</h1>
        
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
            <p className="font-medium">{error}</p>
            {error.includes('submit a profile') && (
              <div className="mt-4">
                <Link
                  href="/submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Submit Your Profile
                </Link>
              </div>
            )}
          </div>
        )}
        
        {!error && reviews.length === 0 && (
          <div className="bg-white shadow sm:rounded-lg p-8 text-center">
            <div className="text-gray-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Reviews Yet</h2>
            <p className="text-gray-600 mb-6">Your profile has been submitted but hasn't received any reviews yet. Check back later!</p>
            
            <div className="mt-4">
              <Link
                href="/submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Update Your Profile
              </Link>
            </div>
          </div>
        )}
        
        {!error && reviews.length > 0 && (
          <>
            {/* Analytics Section */}
            {analytics && (
              <div className="mb-6">
                <ReviewAnalytics 
                  averageRating={analytics.average_rating}
                  reviewCount={analytics.review_count}
                  ratingDistribution={analytics.rating_distribution}
                />
              </div>
            )}
            
            {/* Reviews Section */}
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-medium text-gray-900">Profile Reviews</h2>
                  <p className="mt-1 text-sm text-gray-500">Feedback from people who reviewed your profile</p>
                </div>
                <Link
                  href="/submit"
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50"
                >
                  Update Profile
                </Link>
              </div>
              
              <div className="border-t border-gray-200">
                <div className="p-6 space-y-6">
                  {reviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      reviewerName={review.reviewer_name || 'Anonymous Reviewer'}
                      rating={review.rating}
                      feedback={review.feedback}
                      date={formatDate(review.created_at)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 
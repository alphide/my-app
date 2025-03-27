'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import Header from '@/components/Header'

export default function Dashboard() {
  const { user, signOut, refreshSession } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isRoleCheckComplete, setIsRoleCheckComplete] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasProfile, setHasProfile] = useState(false)
  
  // Add a mounted ref to prevent duplicate initialization
  const isMounted = useRef(false);
  const visibilityChangeRef = useRef(false);

  useEffect(() => {
    console.log('Dashboard mounting, user state:', !!user);
    
    // Skip if we've already mounted once and this is a tab visibility change
    if (isMounted.current && visibilityChangeRef.current) {
      console.log('Skipping full initialization due to tab visibility change');
      visibilityChangeRef.current = false;
      return;
    }
    
    // Mark as mounted
    isMounted.current = true;
    
    if (!user) {
      console.log('No user, redirecting to login');
      router.push('/login')
      return
    }
    
    // Ensure we have a user record in the database
    const ensureUserRecord = async () => {
      try {
        // First check if the user already exists with this ID
        const { data: existingUser, error: idCheckError } = await supabase
          .from('users')
          .select('id, email')
          .eq('id', user.id)
          .maybeSingle();
        
        if (idCheckError) {
          console.error('Error checking user existence by ID:', idCheckError);
          return;
        }
        
        // If user already exists with correct ID, we're good
        if (existingUser) {
          console.log('User record exists with correct ID in database');
          return;
        }
        
        // Check if a user exists with the same email but different ID
        const { data: emailUser, error: emailCheckError } = await supabase
          .from('users')
          .select('id, email')
          .eq('email', user.email)
          .maybeSingle();
          
        if (emailCheckError) {
          console.error('Error checking user existence by email:', emailCheckError);
          return;
        }
        
        if (emailUser) {
          // User exists with email but has wrong ID - update the ID
          console.log('User record found with matching email but different ID. Updating...');
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              id: user.id, 
              role: localStorage.getItem('preferredRole') || 
                    (emailUser as any)['role'] || 
                    null 
            })
            .eq('email', user.email);
            
          if (updateError) {
            console.error('Error updating user ID:', updateError);
          } else {
            console.log('User ID updated successfully');
          }
          return;
        }
        
        // If no user record exists at all, create one
        console.log('No user record found, creating new one...');
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: user.id,
            email: user.email,
            role: localStorage.getItem('preferredRole') || null
          });
        
        if (insertError) {
          console.error('Error creating user record:', insertError);
        } else {
          console.log('User record created successfully');
        }
      } catch (err) {
        console.error('Error ensuring user record:', err);
      }
    };
    
    ensureUserRecord();
    
    // Try to restore from session storage first to avoid unnecessary API calls
    const savedState = sessionStorage.getItem('dashboardState');
    if (savedState) {
      try {
        const parsedState = JSON.parse(savedState);
        console.log('Found saved state, using it instead of API calls', parsedState);
        
        if (parsedState.userRole) {
          setUserRole(parsedState.userRole);
          setHasProfile(parsedState.hasProfile || false);
          setIsRoleCheckComplete(true);
          setLoading(false);
          return; // Skip the API calls completely
        }
      } catch (error) {
        console.error('Error parsing saved state:', error);
        // Continue with normal initialization
      }
    }

    // Check if user has a role in the users table
    const checkUserRole = async () => {
      // Return immediately if this is a tab visibility change
      if (visibilityChangeRef.current) {
        console.log('Skipping role check due to tab visibility change');
        return;
      }
      
      setLoading(true);
      try {
        console.log('Checking user role for:', user.id);
        // First check localStorage as a quick source
        const localRole = localStorage.getItem('preferredRole');
        console.log('Role from localStorage:', localRole);
        
        // Then make the database query without using .single()
        const { data, error } = await supabase
          .from('users')
          .select('role, display_name, username')
          .eq('id', user.id);
        
        console.log('Database role query result:', { data, error });
        
        let roleToSet = null;
        
        // If we have data and at least one record
        if (data && data.length > 0 && data[0].role) {
          console.log('Found role in database:', data[0].role);
          roleToSet = data[0].role;
          // Also update localStorage for quick access next time
          localStorage.setItem('preferredRole', data[0].role);

          // Check if the user needs to complete their profile
          if (!data[0].display_name || !data[0].username) {
            console.log('User needs to complete profile information');
            setLoading(false);
            setIsRoleCheckComplete(true);
            router.push('/profile-setup');
            return;
          }

          // If the user is a submitter, check if they have a profile
          if (data[0].role === 'submitter') {
            checkUserProfile(user.id);
          }
        } 
        // If database has no role but localStorage does, update the database
        else if (localRole === 'submitter' || localRole === 'reviewer') {
          console.log('Using role from localStorage and updating database:', localRole);
          roleToSet = localRole;
          
          // Now that RLS policies are fixed, update the database
          const { error: updateError } = await supabase
            .from('users')
            .update({ role: localRole })
            .eq('id', user.id);
          
          if (updateError) {
            console.error('Error updating role in database:', updateError);
          } else {
            console.log('Successfully updated role in database');
          }
          
          // Redirect to profile setup since role is set but profile is incomplete
          setLoading(false);
          setIsRoleCheckComplete(true);
          router.push('/profile-setup');
          return;
        }
        // Otherwise, no role is found
        else {
          console.log('No role found in database or localStorage');
          roleToSet = null;
        }
        
        // Set the role state and IMMEDIATELY set isRoleCheckComplete flag
        setUserRole(roleToSet);
        
        // Safely complete the role check
        setLoading(false);
        // Fix the race condition issue with a local variable
        setIsRoleCheckComplete(true);
      } catch (error) {
        console.error('Error checking user role:', error);
        // Fall back to localStorage if there's an error
        const localRole = localStorage.getItem('preferredRole');
        if (localRole === 'submitter' || localRole === 'reviewer') {
          console.log('Falling back to localStorage role due to error:', localRole);
          setUserRole(localRole);
          
          // If the user is a submitter, check if they have a profile
          if (localRole === 'submitter') {
            checkUserProfile(user.id);
          }
        }
        
        // Complete the role check even on error
        setLoading(false);
        setIsRoleCheckComplete(true);
      }
    };

    const checkUserProfile = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', userId)
        
        if (data && data.length > 0) {
          setHasProfile(true)
        } else {
          setHasProfile(false)
        }
      } catch (error) {
        console.error('Error checking user profile:', error)
      }
    }

    checkUserRole();
  }, [user, router]);

  // Add debugging for when userRole changes
  useEffect(() => {
    console.log('userRole changed:', userRole)
  }, [userRole])

  // Add a separate effect for visibility change handling to avoid dependency issues
  useEffect(() => {
    // Handle visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('Page became visible, setting visibility change flag');
        // Set the visibility change flag to true
        visibilityChangeRef.current = true;
        
        // Check session without triggering full remounts
        (async () => {
          try {
            // Just check if session exists, don't refresh it yet
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
              console.log('Session still valid on tab visibility change');
              // No need to do anything, component will use existing state
            } else {
              console.log('No session on tab visibility change, manually handling');
              // Only redirect if truly not authenticated
              if (!user) {
                router.push('/login');
              }
            }
          } catch (error) {
            console.error('Error checking session on visibility change:', error);
          }
        })();
      }
    };

    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Remove event listener on cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, router]);

  // Add a custom hook to persist session state during tab changes
  useEffect(() => {
    // Store current state in sessionStorage when component unmounts
    return () => {
      if (userRole && isRoleCheckComplete && !loading) {
        try {
          // Store important state in sessionStorage to recover after tab switch
          const stateToStore = {
            userRole,
            hasProfile,
            isRoleCheckComplete: true
          };
          sessionStorage.setItem('dashboardState', JSON.stringify(stateToStore));
          console.log('Stored dashboard state in sessionStorage', stateToStore);
        } catch (error) {
          console.error('Error storing dashboard state:', error);
        }
      }
    };
  }, [userRole, hasProfile, isRoleCheckComplete, loading]);

  // Try to recover state from sessionStorage on component mount
  useEffect(() => {
    try {
      const savedState = sessionStorage.getItem('dashboardState');
      const localStorageRole = localStorage.getItem('preferredRole');
      
      // First check if we have a saved state
      if (savedState && user) {
        const parsedState = JSON.parse(savedState);
        console.log('Recovered dashboard state:', parsedState);
        
        // Batch state updates to avoid unnecessary rerenders
        const stateUpdates = () => {
          // Only set if we don't already have a role
          if (parsedState.userRole && !userRole) {
            console.log('Setting recovered role:', parsedState.userRole);
            setUserRole(parsedState.userRole);
            // Also make sure localStorage is synced
            localStorage.setItem('preferredRole', parsedState.userRole);
          }
          
          if (parsedState.hasProfile !== undefined) {
            setHasProfile(parsedState.hasProfile);
          }
          
          if (parsedState.isRoleCheckComplete) {
            setIsRoleCheckComplete(true);
            setLoading(false);
          }
        };
        
        // Execute these updates on next tick to prevent race conditions
        setTimeout(stateUpdates, 0);
      }
      // If no saved state but we have a localStorage role, use that
      else if (localStorageRole && user && !userRole) {
        console.log('Using role from localStorage:', localStorageRole);
        setUserRole(localStorageRole);
        setIsRoleCheckComplete(true);
        setLoading(false);
        
        // Store this in sessionStorage for consistency
        const stateToStore = {
          userRole: localStorageRole,
          hasProfile: false,
          isRoleCheckComplete: true
        };
        sessionStorage.setItem('dashboardState', JSON.stringify(stateToStore));
      }
    } catch (error) {
      console.error('Error handling saved state:', error);
      
      // Fallback to localStorage even if there's an error
      const localRole = localStorage.getItem('preferredRole');
      if (localRole && user && !userRole) {
        setUserRole(localRole);
        setIsRoleCheckComplete(true);
        setLoading(false);
      }
    }
  }, [user, userRole]);

  // Add a safety timeout to prevent infinite loading state
  useEffect(() => {
    if (loading) {
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Safety timeout triggered - forcing loading to complete');
          setLoading(false);
          setIsRoleCheckComplete(true);
          
          // Try to recover role from localStorage as fallback
          const localRole = localStorage.getItem('preferredRole');
          if (localRole && !userRole) {
            console.log('Setting role from localStorage as fallback:', localRole);
            setUserRole(localRole);
          }
        }
      }, 5000); // 5 second timeout
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, userRole]);

  // Show loading until both user is loaded and role check is complete
  if (loading || !isRoleCheckComplete) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your profile...</p>
        </div>
      </div>
    )
  }

  const handleRoleSelect = async (role: 'reviewer' | 'submitter') => {
    try {
      console.log(`Role selection started for: ${role}`)
      setIsSubmitting(true)
      setError(null)
      
      // Set the role locally first as fallback
      setUserRole(role)
      localStorage.setItem('preferredRole', role)
      console.log('Role set in localStorage:', role)
      
      // Now that RLS is fixed, update the database directly
      const { error: updateError } = await supabase
        .from('users')
        .update({ role })
        .eq('id', user?.id)
      
      if (updateError) {
        console.error('Error updating role in database:', updateError)
        setError(`Error saving role to database: ${updateError.message}. Using localStorage as fallback.`)
        // Even if there's an error, we'll proceed to the profile setup page
      } else {
        console.log('Successfully updated role in database')
      }
      
      // Redirect to the profile setup page instead of refreshing
      router.push('/profile-setup')
    } catch (error: any) {
      console.error('Error setting user role:', error)
      
      // Even if there's an error, set the role locally and continue
      setUserRole(role)
      localStorage.setItem('preferredRole', role)
      setError(`Error: ${error.message}. Using localStorage as fallback.`)
      setIsSubmitting(false)
      
      // Still redirect to profile setup
      router.push('/profile-setup')
    }
  }

  // If user is new (no role), show role selection
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header currentPage="dashboard" />
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Welcome to Vett! Choose your path:
            </h1>
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <button
                onClick={() => handleRoleSelect('submitter')}
                disabled={isSubmitting}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
              >
                <h2 className="text-2xl font-semibold mb-4 text-primary">Profile Submitter</h2>
                <p className="text-gray-600">
                  Get your dating profile reviewed by real women and receive valuable feedback
                </p>
                {isSubmitting && (
                  <div className="mt-4">
                    <div className="animate-spin h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect('reviewer')}
                disabled={isSubmitting}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
              >
                <h2 className="text-2xl font-semibold mb-4 text-primary">Profile Reviewer</h2>
                <p className="text-gray-600">
                  Help others improve their dating profiles by providing honest, constructive feedback
                </p>
                {isSubmitting && (
                  <div className="mt-4">
                    <div className="animate-spin h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If user has a role, show their dashboard
  return (
    <div className="min-h-screen bg-gray-50">
      <Header currentPage="dashboard" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back!
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            You're signed in as a {userRole === 'submitter' ? 'Profile Submitter' : 'Profile Reviewer'}
          </p>
        </div>

        {userRole === 'submitter' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Submit Your Profile</h2>
              <p className="text-gray-600 mb-6">
                {hasProfile 
                  ? "Update your dating profile to get more feedback from our reviewers."
                  : "Submit your dating profile to get feedback from our reviewers."}
              </p>
              <Link 
                href="/submit" 
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                {hasProfile ? "Update Profile" : "Submit Profile"}
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">My Reviews</h2>
              <p className="text-gray-600 mb-6">
                {hasProfile 
                  ? "Check the reviews and feedback you've received on your profile."
                  : "Submit your profile first to receive reviews from our community."}
              </p>
              {hasProfile ? (
                <Link 
                  href="/my-reviews" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  View Reviews
                </Link>
              ) : (
                <Link 
                  href="/submit" 
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Submit Profile
                </Link>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">Review Profiles</h2>
              <p className="text-gray-600 mb-6">
                Help others improve their dating profiles by providing honest, constructive feedback.
              </p>
              <a 
                href="#"
                onClick={async (e) => {
                  e.preventDefault();
                  
                  try {
                    console.log('Starting review process, checking auth...');
                    // Set a flag to indicate we're in review mode - this helps
                    // the review page know it should attempt to work in mock mode if needed
                    localStorage.setItem('attemptingReview', 'true');
                    
                    // Instead of making an API request that might fail, go directly to the review page
                    // The review page has its own auth checking logic
                    router.push('/review');
                  } catch (error) {
                    console.error('Error navigating to review page:', error);
                    // Still navigate to the review page, which will handle auth and show mock data if needed
                    router.push('/review');
                  }
                }}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Start Reviewing
              </a>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900">My Reviewed Profiles</h2>
              <p className="text-gray-600 mb-6">
                View a history of profiles you've reviewed and the feedback you provided.
              </p>
              <span className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-400 bg-gray-100 cursor-not-allowed">
                Coming Soon
              </span>
            </div>
          </div>
        )}

        <div className="mt-12 bg-white rounded-xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Want to switch roles?</h2>
            <div className="flex gap-4">
              <button
                onClick={() => handleRoleSelect('submitter')}
                className={`px-4 py-2 rounded-md ${userRole === 'submitter' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                disabled={userRole === 'submitter' || isSubmitting}
              >
                {isSubmitting && userRole !== 'submitter' ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                    Setting...
                  </span>
                ) : (
                  'Profile Submitter'
                )}
              </button>
              <button
                onClick={() => handleRoleSelect('reviewer')}
                className={`px-4 py-2 rounded-md ${userRole === 'reviewer' 
                  ? 'bg-primary text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                disabled={userRole === 'reviewer' || isSubmitting}
              >
                {isSubmitting && userRole !== 'reviewer' ? (
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 rounded-full border-2 border-t-transparent border-white animate-spin"></span>
                    Setting...
                  </span>
                ) : (
                  'Profile Reviewer'
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="mb-4 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm">
              {error}
            </div>
          )}
          <p className="text-gray-600">
            You can switch between being a profile submitter and a reviewer at any time.
            Your selected role will be remembered even after you log out.
          </p>
        </div>
      </div>
    </div>
  )
} 
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('GET /api/get-profile-to-review - Request received');
  
  try {
    // Check for Authorization header as fallback
    const authHeader = request.headers.get('Authorization');
    console.log('Authorization header present:', !!authHeader);
    
    // Create a server-side Supabase client with auth context
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session and user
    let { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // If no session from cookies but we have Authorization header, try to use it
    if (!session && authHeader && authHeader.startsWith('Bearer ')) {
      console.log('No session from cookies, attempting to use Authorization header');
      const token = authHeader.replace('Bearer ', '');
      
      try {
        // Try to get user information from the token
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          console.log('Successfully retrieved user from token:', user.id);
          
          // For RLS to work, we need to set the session manually
          // Create a test session
          const { data, error } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: '',
          });
          
          if (!error && data.session) {
            console.log('Session set from token');
            session = data.session;
          } else {
            console.error('Error setting session from token:', error);
          }
        } else {
          console.error('Error getting user from token:', error);
        }
      } catch (tokenError) {
        console.error('Error processing auth token:', tokenError);
      }
    }
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { error: 'Session error', details: sessionError.message },
        { status: 401 }
      );
    }
    
    if (!session) {
      console.log('No active session found');
      return NextResponse.json(
        { error: 'Unauthorized - No active session' },
        { status: 401 }
      );
    }
    
    console.log('Session found for user:', session.user.id);
    const reviewerId = session.user.id;
    
    // Get user role to ensure they are a reviewer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', reviewerId)
      .maybeSingle();
      
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'Failed to get user information' },
        { status: 500 }
      );
    }
    
    if (userData.role !== 'reviewer') {
      return NextResponse.json(
        { error: 'Only reviewers can access this endpoint' },
        { status: 403 }
      );
    }
    
    // Get profiles already reviewed by this reviewer
    const { data: reviewedProfiles, error: reviewedError } = await supabase
      .from('reviews')
      .select('profile_id')
      .eq('reviewer_id', reviewerId);
      
    if (reviewedError) {
      return NextResponse.json(
        { error: 'Failed to fetch reviewed profiles' },
        { status: 500 }
      );
    }
    
    // Extract profile IDs that have already been reviewed
    const reviewedProfileIds = reviewedProfiles.map(review => review.profile_id);
    
    // Get a random profile that hasn't been reviewed by this reviewer
    let query = supabase
      .from('profiles')
      .select(`
        id,
        profile_text,
        images,
        user_id,
        users:user_id (display_name, username)
      `)
      .neq('user_id', reviewerId); // Don't show the reviewer their own profile
    
    // Add filter for profiles not already reviewed if there are any
    if (reviewedProfileIds.length > 0) {
      query = query.not('id', 'in', `(${reviewedProfileIds.join(',')})`);
    }
    
    // Get random profile by ordering randomly and taking the first one
    const { data: profiles, error: profilesError } = await query
      .order('created_at')
      .limit(1);
      
    if (profilesError) {
      return NextResponse.json(
        { error: 'Failed to fetch profiles' },
        { status: 500 }
      );
    }
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json(
        { message: 'No more profiles to review' },
        { status: 404 }
      );
    }
    
    // Return the profile data
    return NextResponse.json({
      profile: profiles[0]
    });
    
  } catch (error: any) {
    console.error('Error in get-profile-to-review API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

// Alternative endpoint for debugging that doesn't require auth
export async function HEAD(request: NextRequest) {
  console.log('HEAD /api/get-profile-to-review - Debug request received');
  return new NextResponse(null, { status: 200 });
} 
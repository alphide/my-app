import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Create a server-side Supabase client with auth context
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current session and user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const userId = session.user.id;
    
    // Get user's profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
      
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to fetch profile information' },
        { status: 500 }
      );
    }
    
    if (!profileData) {
      return NextResponse.json(
        { message: 'No profile found' },
        { status: 404 }
      );
    }
    
    // Get reviews for the user's profile
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        feedback,
        created_at,
        reviewer_id,
        reviewer_name
      `)
      .eq('profile_id', profileData.id)
      .order('created_at', { ascending: false });
      
    if (reviewsError) {
      return NextResponse.json(
        { error: 'Failed to fetch reviews' },
        { status: 500 }
      );
    }
    
    // Calculate analytics
    let totalRating = 0;
    const reviewCount = reviews.length;
    
    if (reviewCount > 0) {
      totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    }
    
    const analytics = {
      reviewCount,
      averageRating: reviewCount > 0 ? (totalRating / reviewCount).toFixed(1) : 0,
      ratingDistribution: {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length,
      }
    };
    
    // Return the reviews and analytics
    return NextResponse.json({
      reviews,
      analytics,
      profileId: profileData.id
    });
    
  } catch (error: any) {
    console.error('Error in get-my-reviews API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
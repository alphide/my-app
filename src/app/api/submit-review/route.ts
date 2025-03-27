import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { profileId, rating, feedback } = await request.json();
    
    // Validate the input
    if (!profileId || !rating || !feedback) {
      return NextResponse.json(
        { error: 'Profile ID, rating, and feedback are required' },
        { status: 400 }
      );
    }
    
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return NextResponse.json(
        { error: 'Rating must be an integer between 1 and 5' },
        { status: 400 }
      );
    }
    
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
    
    const reviewerId = session.user.id;
    
    // Get reviewer information
    const { data: reviewerData, error: reviewerError } = await supabase
      .from('users')
      .select('display_name')
      .eq('id', reviewerId)
      .single();
      
    if (reviewerError) {
      return NextResponse.json(
        { error: 'Failed to get reviewer information' },
        { status: 500 }
      );
    }
    
    // Check if this reviewer has already reviewed this profile
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('profile_id', profileId)
      .eq('reviewer_id', reviewerId)
      .maybeSingle();
      
    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this profile' },
        { status: 400 }
      );
    }
    
    // Get the profile owner ID for notification purposes
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('id', profileId)
      .single();
      
    if (profileError) {
      return NextResponse.json(
        { error: 'Failed to get profile information' },
        { status: 500 }
      );
    }
    
    // Create the review
    const { data: reviewData, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        profile_id: profileId,
        reviewer_id: reviewerId,
        reviewer_name: reviewerData.display_name || 'Anonymous Reviewer',
        rating: rating,
        feedback: feedback,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();
      
    if (reviewError) {
      return NextResponse.json(
        { error: 'Failed to submit review' },
        { status: 500 }
      );
    }
    
    // Create a notification for the profile owner
    await supabase
      .from('notifications')
      .insert({
        user_id: profileData.user_id,
        message: `You received a new review with rating: ${rating}/5`,
        type: 'new_review',
        related_id: reviewData.id,
        is_read: false,
        created_at: new Date().toISOString(),
      });
    
    return NextResponse.json({
      success: true,
      reviewId: reviewData.id
    });
    
  } catch (error: any) {
    console.error('Error in submit-review API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
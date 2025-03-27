import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { profileId, rating, feedback } = await request.json();
  
  const { data: { user } } = await supabase.auth.getUser();
  const reviewerId = user?.id;

  if (!reviewerId) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // Get the user's display name
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', reviewerId)
    .single();

  if (userError) {
    console.error('Error getting user data:', userError);
    return NextResponse.json({ error: 'Failed to get user data' }, { status: 500 });
  }

  // Store the display name for the review
  const reviewerName = userData.display_name || 'Anonymous Reviewer';

  // Insert the review
  const { data: review, error: insertError } = await supabase
    .from('reviews')
    .insert({
      profile_id: profileId,
      reviewer_id: reviewerId,
      reviewer_name: reviewerName,
      rating,
      feedback,
      created_at: new Date().toISOString()
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Error inserting review:', insertError);
    return NextResponse.json({ error: 'Failed to insert review' }, { status: 500 });
  }

  return NextResponse.json({ review });
} 
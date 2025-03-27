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
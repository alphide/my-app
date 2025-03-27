import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const profileText = formData.get('profileText') as string;
    const imageFiles = [];
    
    // Extract up to 6 images from the form data
    for (let i = 0; i < 6; i++) {
      const image = formData.get(`image${i}`) as File | null;
      if (image && image.size > 0) {
        imageFiles.push(image);
      }
    }
    
    // Validate
    if (imageFiles.length === 0) {
      return NextResponse.json(
        { error: 'At least one image is required' },
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
    
    const userId = session.user.id;
    
    // Upload images to Supabase Storage
    const imageUrls = [];
    for (let i = 0; i < imageFiles.length; i++) {
      const file = imageFiles[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}_${Date.now()}_${i}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('profile_images')
        .upload(fileName, file);
      
      if (uploadError) {
        console.error('Error uploading image:', uploadError);
        continue;
      }
      
      // Get public URL for the uploaded image
      const { data: urlData } = supabase
        .storage
        .from('profile_images')
        .getPublicUrl(fileName);
      
      if (urlData) {
        imageUrls.push(urlData.publicUrl);
      }
    }
    
    if (imageUrls.length === 0) {
      return NextResponse.json(
        { error: 'Failed to upload images' },
        { status: 500 }
      );
    }
    
    // Check if user already has a submitted profile
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    let profileId;
    
    if (existingProfile) {
      // Update existing profile
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          profile_text: profileText,
          images: imageUrls,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingProfile.id)
        .select('id')
        .single();
      
      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update profile' },
          { status: 500 }
        );
      }
      
      profileId = updatedProfile.id;
    } else {
      // Create new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          profile_text: profileText,
          images: imageUrls,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();
      
      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create profile' },
          { status: 500 }
        );
      }
      
      profileId = newProfile.id;
    }
    
    return NextResponse.json({
      success: true,
      profileId,
      imageUrls
    });
    
  } catch (error: any) {
    console.error('Error in submit-profile API route:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 
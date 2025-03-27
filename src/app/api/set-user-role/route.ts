import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, email, role } = await request.json();
    
    if (!userId || !email || !role) {
      return NextResponse.json(
        { 
          error: 'Missing required fields',
          message: 'User ID, email, and role are required'
        },
        { status: 400 }
      );
    }
    
    // Valid roles
    if (role !== 'submitter' && role !== 'reviewer') {
      return NextResponse.json(
        { 
          error: 'Invalid role',
          message: 'Role must be either "submitter" or "reviewer"'
        },
        { status: 400 }
      );
    }
    
    // Create a server-side Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current session to verify authentication
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || session.user.id !== userId) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          message: 'You must be logged in and can only update your own role'
        },
        { status: 401 }
      );
    }
    
    // First check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if user exists:', checkError);
    }
    
    let operation;
    if (existingUser) {
      // Update existing user
      console.log('Updating existing user with role:', role);
      operation = supabase
        .from('users')
        .update({
          role: role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } else {
      // Insert new user
      console.log('Creating new user with role:', role);
      operation = supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          role: role,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
    }
    
    // Execute the operation
    const { error } = await operation;
    
    if (error) {
      console.error('Error setting user role via API route:', error);
      return NextResponse.json(
        { 
          error: 'Database error',
          message: error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Unexpected error in set-user-role API route:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 
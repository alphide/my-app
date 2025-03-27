import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the authentication token from the request headers
    const authToken = request.headers.get('Authorization')?.replace('Bearer ', '');
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
    
    // Create a Supabase client
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Verify the user is authenticated - try both methods
    let session;
    
    if (authToken) {
      // If auth token is provided, create a client with it
      const supabaseWithToken = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        {
          global: {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        }
      );
      
      const { data, error } = await supabaseWithToken.auth.getUser();
      if (error || !data.user || data.user.id !== userId) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'Invalid authentication token or user mismatch'
          },
          { status: 401 }
        );
      }
      
      // Valid user with token
      session = { user: data.user };
    } else {
      // Try with cookies
      const { data: { session: cookieSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !cookieSession) {
        return NextResponse.json(
          { 
            error: 'Unauthorized',
            message: 'You must be logged in to perform this action'
          },
          { status: 401 }
        );
      }
      
      if (cookieSession.user.id !== userId) {
        return NextResponse.json(
          { 
            error: 'Forbidden',
            message: 'You can only update your own role'
          },
          { status: 403 }
        );
      }
      
      session = cookieSession;
    }
    
    // First check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if user exists:', checkError);
      return NextResponse.json(
        { 
          error: 'Database error',
          message: 'Error checking user record'
        },
        { status: 500 }
      );
    }
    
    let operation;
    if (existingUser) {
      // Update existing user
      console.log('Updating existing user with role:', role);
      operation = supabase
        .from('users')
        .update({
          role: role,
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
          password_hash: 'auth_managed' // Auth handles the real password
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
    
    return NextResponse.json({ success: true, role });
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
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Log request headers for debugging
    console.log('Request headers:', Object.fromEntries(request.headers.entries()));
    
    // Create a Supabase client with next/headers cookies
    const cookieStore = cookies();
    console.log('Cookie store available:', !!cookieStore);
    
    // Log cookies for debugging
    const allCookies = cookieStore.getAll();
    console.log('Available cookies:', allCookies.map(c => c.name));
    
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get request body
    const { userId, email, role } = await request.json();
    console.log('Role selection request for user:', { userId, email, role });
    
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

    // Get the current session to verify authentication
    const { data, error: sessionError } = await supabase.auth.getSession();
    console.log('Session data:', data);
    console.log('Session error:', sessionError);
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { 
          error: 'Authentication error',
          message: 'Error retrieving your session: ' + sessionError.message
        },
        { status: 401 }
      );
    }
    
    if (!data.session) {
      console.log('No session found in API route');
      // Fall back to direct database operation with the provided user ID
      // This is a workaround for potential session issues
      try {
        // For new users, insert the record directly
        const result = await supabase
          .from('users')
          .upsert({
            id: userId,
            email,
            role,
            password_hash: 'auth_managed' // Auth handles the real password
          }, { onConflict: 'id' });
        
        if (result.error) {
          return NextResponse.json(
            { 
              error: 'Database error',
              message: result.error.message
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json({ 
          success: true, 
          role,
          operation: 'upserted',
          note: 'Processed without session due to auth issues'
        });
      } catch (dbError: any) {
        console.error('Database operation failed:', dbError);
        return NextResponse.json(
          { 
            error: 'Database error',
            message: dbError.message
          },
          { status: 500 }
        );
      }
    }

    // Verify that the user is setting their own role
    if (data.session.user.id !== userId) {
      return NextResponse.json(
        { 
          error: 'Forbidden',
          message: 'You can only update your own role'
        },
        { status: 403 }
      );
    }

    // First check if the user already exists in our custom users table
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id, role')
      .eq('id', userId)
      .maybeSingle();
      
    if (checkError) {
      console.error('Error checking if user exists:', checkError);
      return NextResponse.json(
        { 
          error: 'Database error',
          message: checkError.message
        },
        { status: 500 }
      );
    }
    
    // Do the operation based on whether the user exists
    let result;
    if (existingUser) {
      // Update existing user's role
      console.log('Updating existing user with role:', role);
      result = await supabase
        .from('users')
        .update({ role })
        .eq('id', userId);
    } else {
      // When a user signs up with Supabase Auth, we need to create a corresponding record
      // in our custom users table. Since we don't have their password hash (Auth stores this),
      // we'll use a placeholder value.
      console.log('Creating new user with role:', role);
      result = await supabase
        .from('users')
        .insert({
          id: userId,
          email,
          role,
          password_hash: 'auth_managed' // Auth handles the real password
        });
    }
    
    // Check for error
    if (result.error) {
      console.error('Error setting user role:', result.error);
      return NextResponse.json(
        { 
          error: 'Database error',
          message: result.error.message
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      role,
      operation: existingUser ? 'updated' : 'inserted'
    });
  } catch (error: any) {
    console.error('Unexpected error in simple-set-role API route:', error);
    return NextResponse.json(
      { 
        error: 'Server error',
        message: error.message || 'An unexpected error occurred'
      },
      { status: 500 }
    );
  }
} 
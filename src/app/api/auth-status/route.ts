import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('GET /api/auth-status - Request received');
  
  try {
    // Create a server-side Supabase client with auth context
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get the current session and user
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json(
        { 
          authenticated: false,
          error: sessionError.message
        },
        { status: 200 } // Return 200 even for errors to avoid fetch failures
      );
    }
    
    if (!session) {
      console.log('No active session found');
      return NextResponse.json(
        { 
          authenticated: false,
          error: 'No active session'
        },
        { status: 200 }
      );
    }
    
    // Check user role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .maybeSingle();
      
    if (userError) {
      return NextResponse.json(
        { 
          authenticated: true,
          user_id: session.user.id,
          error: 'Could not verify role',
          role: null
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json({
      authenticated: true,
      user_id: session.user.id,
      role: userData?.role || null,
      expires_at: session.expires_at
    });
    
  } catch (error: any) {
    console.error('Error in auth-status API route:', error);
    return NextResponse.json(
      { 
        authenticated: false,
        error: error.message || 'An unexpected error occurred'
      },
      { status: 200 } // Always return 200 to avoid fetch failures
    );
  }
} 
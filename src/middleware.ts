import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'

// Paths that don't require authentication
const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/auth/error']

// Paths that require authentication
const protectedPaths = ['/dashboard', '/profile', '/submit', '/review', '/my-reviews', '/settings']

// API paths that require authentication
const protectedApiPaths = ['/api/set-user-role', '/api/simple-set-role', 
                        '/api/submit-profile', '/api/submit-review', 
                        '/api/get-profile-to-review', '/api/get-my-reviews']

export async function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Allow access to public paths without authentication
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next()
  }

  // Special handling for API routes
  if (path.startsWith('/api/')) {
    // Check if this is a protected API route
    const requiresAuth = protectedApiPaths.some(apiPath => path === apiPath);
    
    if (!requiresAuth) {
      return NextResponse.next()
    }
    
    // For protected API routes, we'll let the API route itself handle auth
    // Just pass through the request with its headers/cookies
    return NextResponse.next()
  }

  // Check if the path requires authentication
  const requiresAuth = protectedPaths.some(protectedPath => path.startsWith(protectedPath))
  
  if (!requiresAuth) {
    return NextResponse.next()
  }

  // Create a response object to modify
  const res = NextResponse.next()
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req: request, res })
  
  try {
    // Get session without trying to refresh - to avoid reloads when switching tabs
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error && error.message !== 'Failed to fetch') {
      console.error('Auth session error in middleware:', error)
      // Redirect to login if there's an authentication error (but not network errors)
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      loginUrl.searchParams.set('error', 'session_error')
      return NextResponse.redirect(loginUrl)
    }
    
    // If no session found, redirect to login
    if (!session) {
      const loginUrl = new URL('/login', request.url)
      // Add the original URL as a query parameter to redirect after login
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    return res
  } catch (error) {
    console.error('Unexpected error in middleware:', error)
    
    // Don't redirect on network errors or when switching tabs
    if (error instanceof Error && error.message === 'Failed to fetch') {
      return res;
    }
    
    // Redirect to login page on unexpected errors
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('error', 'unexpected_error')
    return NextResponse.redirect(loginUrl)
  }
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /_next (Next.js internals)
     * 2. /_static (inside /public)
     * 3. /_vercel (Vercel internals)
     * 4. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!_next|_static|_vercel|favicon.ico|sitemap.xml).*)',
  ],
}
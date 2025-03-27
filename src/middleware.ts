import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// Paths that don't require authentication
const publicPaths = ['/', '/login', '/signup', '/auth/callback', '/auth/error']

// Paths that require authentication
const protectedPaths = ['/dashboard', '/profile', '/submit', '/review']

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname

  // Allow access to public paths without authentication
  if (publicPaths.some(publicPath => path.startsWith(publicPath))) {
    return NextResponse.next()
  }

  // Check if the path requires authentication
  const requiresAuth = protectedPaths.some(protectedPath => path.startsWith(protectedPath))
  
  if (!requiresAuth) {
    return NextResponse.next()
  }

  // Check for session cookie
  const supabaseSession = request.cookies.get('sb-session')
  
  // If no session cookie is found, redirect to login
  if (!supabaseSession) {
    const loginUrl = new URL('/login', request.url)
    // Add the original URL as a query parameter to redirect after login
    loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all paths except:
     * 1. /api routes
     * 2. /_next (Next.js internals)
     * 3. /_static (inside /public)
     * 4. /_vercel (Vercel internals)
     * 5. /favicon.ico, /sitemap.xml (static files)
     */
    '/((?!api|_next|_static|_vercel|favicon.ico|sitemap.xml).*)',
  ],
}
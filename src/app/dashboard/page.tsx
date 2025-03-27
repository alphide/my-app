'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has a role in the users table
    const checkUserRole = async () => {
      try {
        // First check localStorage as a quick source
        const localRole = localStorage.getItem('preferredRole')
        
        // Then make the database query without using .single()
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
        
        // If we have data and at least one record
        if (data && data.length > 0 && data[0].role) {
          setUserRole(data[0].role)
          // Also update localStorage for quick access next time
          localStorage.setItem('preferredRole', data[0].role)
        } 
        // If database has no role but localStorage does, use that
        else if (localRole === 'submitter' || localRole === 'reviewer') {
          setUserRole(localRole)
        }
        // Otherwise, no role is found
        else {
          setUserRole(null)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
        // Fall back to localStorage if there's an error
        const localRole = localStorage.getItem('preferredRole')
        if (localRole === 'submitter' || localRole === 'reviewer') {
          setUserRole(localRole)
        }
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [user, router])

  const handleRoleSelect = async (role: 'reviewer' | 'submitter') => {
    try {
      setIsSubmitting(true)
      setError(null)
      
      // Use the API route to set user role
      const response = await fetch('/api/set-user-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          email: user?.email,
          role: role,
        }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to set user role')
      }
      
      // On success, store the role in localStorage as a backup
      localStorage.setItem('preferredRole', role)
      
      // Force a refresh to ensure the UI updates correctly
      window.location.href = '/dashboard'
    } catch (error: any) {
      console.error('Error setting user role:', error)
      setError(error.message || 'Failed to set role. Please try again.')
      setIsSubmitting(false)
      
      // Try to update the UI directly with localStorage as a fallback
      setUserRole(role)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // If user is new (no role), show role selection
  if (!userRole) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div className="flex items-center group">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient opacity-50 cursor-not-allowed">
                Vett
              </span>
            </div>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 focus:outline-none nav-link"
            >
              Logout
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Welcome to Vett! Choose your path:
            </h1>
            
            {error && (
              <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <button
                onClick={() => handleRoleSelect('submitter')}
                disabled={isSubmitting}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
              >
                <h2 className="text-2xl font-semibold mb-4 text-primary">Profile Submitter</h2>
                <p className="text-gray-600">
                  Get your dating profile reviewed by real women and receive valuable feedback
                </p>
                {isSubmitting && (
                  <div className="mt-4">
                    <div className="animate-spin h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}
              </button>

              <button
                onClick={() => handleRoleSelect('reviewer')}
                disabled={isSubmitting}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 disabled:opacity-70 disabled:transform-none disabled:cursor-not-allowed"
              >
                <h2 className="text-2xl font-semibold mb-4 text-primary">Profile Reviewer</h2>
                <p className="text-gray-600">
                  Help others improve their dating profiles by providing honest, constructive feedback
                </p>
                {isSubmitting && (
                  <div className="mt-4">
                    <div className="animate-spin h-5 w-5 border-b-2 border-primary mx-auto"></div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // If user has a role, show their dashboard
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center group">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
              Vett
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/settings/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 focus:outline-none nav-link"
            >
              <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span>Profile</span>
            </Link>
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-primary hover:text-primary/80 focus:outline-none nav-link"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome back!
          </h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
          {userRole === 'submitter' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Your Submissions</h2>
              <p className="text-gray-600">No submissions yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Profiles to Review</h2>
              <p className="text-gray-600">No profiles available for review</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 
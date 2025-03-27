'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function Dashboard() {
  const { user } = useAuth()
  const router = useRouter()
  const [userRole, setUserRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has a role in the users table
    const checkUserRole = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (data) {
          setUserRole(data.role)
        }
      } catch (error) {
        console.error('Error checking user role:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUserRole()
  }, [user])

  const handleRoleSelect = async (role: 'reviewer' | 'submitter') => {
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: user?.id,
          email: user?.email,
          role: role,
          created_at: new Date().toISOString(),
        })

      if (error) throw error
      setUserRole(role)
    } catch (error) {
      console.error('Error setting user role:', error)
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-8">
              Welcome to Vett! Choose your path:
            </h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
              <button
                onClick={() => handleRoleSelect('submitter')}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <h2 className="text-2xl font-semibold mb-4 text-primary">Profile Submitter</h2>
                <p className="text-gray-600">
                  Get your dating profile reviewed by real women and receive valuable feedback
                </p>
              </button>

              <button
                onClick={() => handleRoleSelect('reviewer')}
                className="group p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <h2 className="text-2xl font-semibold mb-4 text-primary">Profile Reviewer</h2>
                <p className="text-gray-600">
                  Help others improve their dating profiles by providing honest, constructive feedback
                </p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            Welcome back!
          </h1>
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
    </div>
  )
} 
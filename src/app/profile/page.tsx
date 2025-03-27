'use client'
import { useAuth } from '@/contexts/AuthContext'

export default function Profile() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Profile</h1>
          
          {user ? (
            <div className="space-y-6">
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold mb-2">Email</h2>
                <p className="text-gray-600">{user.email}</p>
              </div>
              
              <div className="border-b pb-4">
                <h2 className="text-xl font-semibold mb-2">Role</h2>
                <p className="text-gray-600">
                  {/* We'll implement role display later */}
                  Role selection coming soon
                </p>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Activity</h2>
                <p className="text-gray-600">
                  No activity yet
                </p>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Please sign in to view your profile</p>
          )}
        </div>
      </div>
    </div>
  )
} 
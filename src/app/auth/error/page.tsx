'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error_description')

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Verification Failed
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {error || 'Your verification link has expired or is invalid'}
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <Link
            href="/(auth)/signup"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Sign up again
          </Link>
          <Link
            href="/(auth)/login"
            className="text-sm font-medium text-primary hover:text-primary/80"
          >
            Return to login
          </Link>
        </div>
      </div>
    </div>
  )
} 
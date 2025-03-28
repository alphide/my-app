'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isVerificationSent, setIsVerificationSent] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [verificationEmail, setVerificationEmail] = useState('');
  const { signUp, signInWithGoogle, signInWithMicrosoft, user } = useAuth();
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    // Check if verification was previously sent but user refreshed the page
    const verificationSent = localStorage.getItem('verificationSent') === 'true';
    const storedEmail = localStorage.getItem('verificationEmail');
    
    if (verificationSent && storedEmail) {
      setIsVerificationSent(true);
      setVerificationEmail(storedEmail);
      setEmail(storedEmail);
    }
    
    if (user && !isVerificationSent) {
      router.push('/dashboard');
    }
  }, [user, router, isVerificationSent, verificationEmail]);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft]);

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // Password validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      const result = await signUp(email, password);
      
      // Check if email confirmation is required
      if (result?.user && !result.session) {
        // Email confirmation required, show verification screen
        setIsVerificationSent(true);
        // Store verification status in localStorage to persist across refreshes
        localStorage.setItem('verificationSent', 'true');
        localStorage.setItem('verificationEmail', email);
      } else if (result?.session) {
        // User is already confirmed and logged in, redirect to dashboard
        localStorage.removeItem('verificationSent');
        localStorage.removeItem('verificationEmail');
        router.push('/dashboard');
      }
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleGoogleSignup = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      console.error('Error:', error.message);
    }
  };

  const handleMicrosoftSignup = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      console.error('Error:', error.message);
    }
  };

  const handleResendVerification = async () => {
    if (timeLeft > 0) return;
    
    try {
      const { data, error } = await supabase.auth.resend({
        type: 'signup',
        email: verificationEmail || email
      });

      if (error) throw error;
      
      setTimeLeft(60);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (isVerificationSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <Link href="/" className="flex items-center group">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
                Vett
              </span>
            </Link>
          </div>
        </div>
        
        <div className="max-w-md w-full space-y-8 mt-16">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Check your email
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We've sent a verification link to {verificationEmail || email}
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleResendVerification}
              disabled={timeLeft > 0}
              className={`mt-4 ${
                timeLeft > 0 
                  ? 'text-gray-400 cursor-not-allowed' 
                  : 'text-primary hover:text-primary/90'
              }`}
            >
              {timeLeft > 0 
                ? `Resend in ${timeLeft}s` 
                : 'Resend verification email'}
            </button>
          </div>

          <div className="text-center mt-4">
            <Link href="/login" className="text-sm text-primary hover:text-primary/90 nav-link">
              Return to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/" className="flex items-center group">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
              Vett
            </span>
          </Link>
        </div>
      </div>
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md mt-16">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Or{' '}
          <Link href="/login" className="font-medium text-primary hover:text-primary/80 nav-link">
            sign in to your account
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
              {error}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleEmailSignup}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div className="mt-1">
                <input
                  id="confirm-password"
                  name="confirm-password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Create account
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleGoogleSignup}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Sign up with Google</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"
                  />
                </svg>
              </button>

              <button
                onClick={handleMicrosoftSignup}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                <span className="sr-only">Sign up with Microsoft</span>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M11.5,2.75h-8a0.75,0.75,0,0,0-.75.75v8a0.75,0.75,0,0,0,.75.75h8a0.75,0.75,0,0,0,.75-.75v-8A0.75,0.75,0,0,0,11.5,2.75Zm0,10h-8a0.75,0.75,0,0,0-.75.75v8a0.75,0.75,0,0,0,.75.75h8a0.75,0.75,0,0,0,.75-.75v-8A0.75,0.75,0,0,0,11.5,12.75Zm10-10h-8a0.75,0.75,0,0,0-.75.75v8a0.75,0.75,0,0,0,.75.75h8a0.75,0.75,0,0,0,.75-.75v-8A0.75,0.75,0,0,0,21.5,2.75Zm0,10h-8a0.75,0.75,0,0,0-.75.75v8a0.75,0.75,0,0,0,.75.75h8a0.75,0.75,0,0,0,.75-.75v-8A0.75,0.75,0,0,0,21.5,12.75Z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
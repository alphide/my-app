'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import NotificationsDropdown from './NotificationsDropdown';
import { supabase } from '@/lib/supabase';

interface HeaderProps {
  currentPage?: string;
}

export default function Header({ currentPage }: HeaderProps) {
  const { user, signOut } = useAuth();
  const { unreadCount } = useNotifications();
  const [displayName, setDisplayName] = useState<string>('');
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch user profile data
      const fetchUserProfile = async () => {
        const { data, error } = await supabase
          .from('users')
          .select('display_name, profile_image_url')
          .eq('id', user.id)
          .single();

        if (!error && data) {
          setDisplayName(data.display_name || '');
          setProfileImageUrl(data.profile_image_url);
        }
      };

      fetchUserProfile();
    }
  }, [user]);

  return (
    <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center group">
          <span className="text-4xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
            Vett
          </span>
        </Link>
        
        {user && (
          <div className="flex items-center gap-4">
            {/* Notifications Dropdown */}
            <NotificationsDropdown />
            
            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/dashboard"
                className={`px-4 py-2 text-sm font-medium ${
                  currentPage === 'dashboard' 
                    ? 'text-primary' 
                    : 'text-gray-600 hover:text-primary/80'
                } focus:outline-none`}
              >
                Dashboard
              </Link>
              
              <Link
                href="/profile-setup"
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium ${
                  currentPage === 'profile' 
                    ? 'text-primary' 
                    : 'text-gray-600 hover:text-primary/80'
                } focus:outline-none`}
              >
                <div className="h-8 w-8 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center text-gray-600">
                  {profileImageUrl ? (
                    <Image 
                      src={profileImageUrl} 
                      alt="Profile" 
                      width={32} 
                      height={32} 
                      className="object-cover w-full h-full"
                      unoptimized={profileImageUrl.includes('unsplash.com')}
                    />
                  ) : (
                    <span>{displayName?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}</span>
                  )}
                </div>
                <span>{displayName || 'Profile'}</span>
              </Link>
            </div>
            
            {/* Mobile Menu Button (only shown on small screens) */}
            <div className="md:hidden">
              <button
                className="p-2 text-gray-600 hover:text-primary"
                aria-label="Menu"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
            
            {/* Logout Button */}
            <button
              onClick={() => signOut()}
              className="hidden md:block px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary/80 focus:outline-none"
            >
              Logout
            </button>
          </div>
        )}
        
        {!user && (
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-primary/80 focus:outline-none"
            >
              Login
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2 text-sm font-medium bg-primary text-white rounded-md hover:bg-primary/90 focus:outline-none"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 
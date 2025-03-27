'use client';

import React from 'react';
import Link from 'next/link';

interface NoProfilesToReviewProps {
  onShowMockProfile: () => void;
}

export default function NoProfilesToReview({ onShowMockProfile }: NoProfilesToReviewProps) {
  return (
    <div className="bg-white shadow sm:rounded-lg p-8 text-center">
      <div className="text-gray-500 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">No Profiles to Review</h2>
      <p className="text-gray-600 mb-6">
        There are currently no profiles available for you to review. 
        This could be because you've already reviewed all available profiles or 
        no users have submitted profiles yet.
      </p>
      
      <div className="mt-4">
        <button
          onClick={onShowMockProfile}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Show Example Profile
        </button>
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-medium text-gray-700 mb-2">Want to see more profiles?</h3>
        <p className="text-sm text-gray-600 mb-4">
          You can invite friends to submit their profiles for review or switch to submitter mode to add your own.
        </p>
        <Link 
          href="/dashboard" 
          className="text-primary hover:text-primary/80 text-sm font-medium"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
} 
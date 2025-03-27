'use client';

import React from 'react';
import Image from 'next/image';

interface ProfileData {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  interests: string[];
  imageUrl?: string;
  lookingFor: string;
  location?: string;
  age?: number;
}

interface ProfileCardProps {
  profile: ProfileData;
  isDemo?: boolean;
}

export default function ProfileCard({ profile, isDemo = false }: ProfileCardProps) {
  const {
    displayName,
    username,
    bio,
    interests,
    imageUrl,
    lookingFor,
    location,
    age
  } = profile;

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {isDemo && (
        <div className="bg-blue-600 text-white text-center py-1 text-sm font-medium">
          Demo Mode - Example Profile
        </div>
      )}
      
      <div className="relative w-full h-80">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${displayName}'s profile`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={imageUrl.includes('unsplash.com')}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <span className="text-6xl font-bold text-gray-400">
              {displayName.charAt(0)}
            </span>
          </div>
        )}
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
            <p className="text-gray-600">@{username}</p>
          </div>
          
          {(age || location) && (
            <div className="text-right">
              {age && <p className="text-gray-700 font-medium">{age} years old</p>}
              {location && (
                <p className="text-gray-600 flex items-center justify-end">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {location}
                </p>
              )}
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-md font-semibold text-gray-800 mb-1">About</h3>
          <p className="text-gray-700 whitespace-pre-line">{bio}</p>
        </div>
        
        {lookingFor && (
          <div className="mb-4">
            <h3 className="text-md font-semibold text-gray-800 mb-1">Looking for</h3>
            <p className="text-gray-700">{lookingFor}</p>
          </div>
        )}
        
        {interests && interests.length > 0 && (
          <div>
            <h3 className="text-md font-semibold text-gray-800 mb-2">Interests</h3>
            <div className="flex flex-wrap gap-2">
              {interests.map((interest, index) => (
                <span 
                  key={index}
                  className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 
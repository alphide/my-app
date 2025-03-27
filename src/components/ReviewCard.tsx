'use client';

import React from 'react';

interface ReviewCardProps {
  reviewerName: string;
  rating: number;
  feedback: string;
  date: string;
}

export default function ReviewCard({ reviewerName, rating, feedback, date }: ReviewCardProps) {
  // Function to get the color based on rating
  const getRatingColor = (rating: number) => {
    if (rating >= 5) return 'text-green-600';
    if (rating >= 4) return 'text-green-500';
    if (rating >= 3) return 'text-yellow-500';
    if (rating >= 2) return 'text-orange-500';
    return 'text-red-500';
  };
  
  // Function to get rating description
  const getRatingText = (rating: number) => {
    if (rating >= 5) return 'Excellent';
    if (rating >= 4) return 'Good';
    if (rating >= 3) return 'Average';
    if (rating >= 2) return 'Below Average';
    return 'Poor';
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md p-6 transition-all duration-300 hover:shadow-lg">
      <div className="flex flex-wrap items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center font-bold text-lg">
            {reviewerName.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <h3 className="font-medium text-gray-900">{reviewerName}</h3>
            <p className="text-xs text-gray-500">{date}</p>
          </div>
        </div>
        
        <div className="mt-2 sm:mt-0 flex items-center">
          <div className={`text-2xl font-bold ${getRatingColor(rating)}`}>
            {rating}
          </div>
          <div className="text-xs text-gray-500 ml-1">/5</div>
          <div className="ml-2 px-2 py-1 bg-gray-100 rounded text-xs">
            {getRatingText(rating)}
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback:</h4>
        <div className="text-gray-600 text-sm whitespace-pre-wrap">
          {feedback}
        </div>
      </div>
      
      {/* Action buttons - could be expanded later */}
      <div className="mt-6 flex items-center justify-end text-xs">
        <button className="text-gray-500 hover:text-gray-700">
          Helpful
        </button>
        <span className="mx-2 text-gray-300">•</span>
        <button className="text-gray-500 hover:text-gray-700">
          Save
        </button>
      </div>
    </div>
  );
} 
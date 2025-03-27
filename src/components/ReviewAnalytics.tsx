'use client';

import React from 'react';

interface ReviewAnalyticsProps {
  averageRating: number;
  reviewCount: number;
  ratingDistribution: Record<string, number>;
}

export default function ReviewAnalytics({ 
  averageRating, 
  reviewCount, 
  ratingDistribution 
}: ReviewAnalyticsProps) {
  // Function to get the color based on rating
  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 3.5) return 'text-green-500';
    if (rating >= 2.5) return 'text-yellow-500';
    if (rating >= 1.5) return 'text-orange-500';
    return 'text-red-500';
  };

  // Calculate percentages for rating distribution
  const getPercentageForRating = (count: number) => {
    if (reviewCount === 0) return 0;
    return Math.round((count / reviewCount) * 100);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Review Summary</h3>
      
      <div className="flex items-center justify-between mb-6">
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Average Rating</p>
          <div className="flex items-baseline">
            <span className={`text-3xl font-bold ${getRatingColor(parseFloat(averageRating.toString()))}`}>
              {parseFloat(averageRating.toString()).toFixed(1)}
            </span>
            <span className="text-sm text-gray-500 ml-1">/5</span>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-500 mb-1">Total Reviews</p>
          <p className="text-3xl font-bold text-gray-800">{reviewCount}</p>
        </div>
      </div>
      
      <div className="space-y-3 mt-6">
        <h4 className="text-sm font-medium text-gray-700">Rating Distribution</h4>
        
        {[5, 4, 3, 2, 1].map((rating) => {
          const count = ratingDistribution[rating.toString()] || 0;
          const percentage = getPercentageForRating(count);
          
          return (
            <div key={rating} className="flex items-center">
              <div className="w-10 text-sm text-gray-600 font-medium">
                {rating}★
              </div>
              <div className="flex-1 mx-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    rating >= 4 ? 'bg-green-500' : 
                    rating >= 3 ? 'bg-yellow-500' : 
                    rating >= 2 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-10 text-xs text-gray-500 text-right">
                {count} ({percentage}%)
              </div>
            </div>
          );
        })}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback Overview</h4>
        <p className="text-sm text-gray-600">
          {reviewCount === 0 && "No reviews yet. Submit your profile to start getting feedback."}
          {reviewCount > 0 && averageRating >= 4 && 
            "Your profile is being received positively! Most reviewers find your profile appealing."}
          {reviewCount > 0 && averageRating >= 3 && averageRating < 4 && 
            "Your profile is doing well, with room for some improvements based on feedback."}
          {reviewCount > 0 && averageRating < 3 && 
            "Consider making some changes to your profile based on the feedback you've received."}
        </p>
      </div>
    </div>
  );
} 
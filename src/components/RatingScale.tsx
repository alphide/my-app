'use client';

import React from 'react';

interface RatingScaleProps {
  rating: number;
  onChange: (rating: number) => void;
}

export default function RatingScale({ rating, onChange }: RatingScaleProps) {
  return (
    <div className="space-y-4">
      <p className="font-medium text-gray-700">Profile Rating</p>
      
      {/* Numeric buttons for rating */}
      <div className="flex items-center justify-between max-w-md mx-auto gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onChange(value)}
            className={`
              flex items-center justify-center w-16 h-16 rounded-full 
              transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 
              ${rating === value 
                ? 'bg-primary text-white scale-110 shadow-lg focus:ring-primary' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-400'}
            `}
            aria-label={`Rate ${value} out of 5`}
          >
            <span className="text-xl font-bold">{value}</span>
          </button>
        ))}
      </div>
      
      {/* Rating descriptions */}
      <div className="flex justify-between text-xs text-gray-500 max-w-md mx-auto px-2">
        <span>Poor</span>
        <span>Below Average</span>
        <span>Average</span>
        <span>Good</span>
        <span>Excellent</span>
      </div>
      
      {/* Selected rating description */}
      <div className="text-center mt-4">
        {rating > 0 && (
          <p className="text-sm font-medium text-primary">
            {rating === 1 && 'Needs significant improvement'}
            {rating === 2 && 'Has some good elements but needs work'}
            {rating === 3 && 'Average profile with room for improvement'}
            {rating === 4 && 'Strong profile with minor suggestions'}
            {rating === 5 && 'Excellent profile, minimal changes needed'}
          </p>
        )}
      </div>
    </div>
  );
} 
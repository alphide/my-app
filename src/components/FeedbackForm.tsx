'use client';

import React, { useState } from 'react';
import RatingScale from './RatingScale';

interface FeedbackFormProps {
  profileId: string;
  onSubmit: (rating: number, feedback: string) => Promise<void>;
  isSubmitting: boolean;
}

export default function FeedbackForm({ 
  profileId, 
  onSubmit,
  isSubmitting 
}: FeedbackFormProps) {
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!feedback.trim()) {
      setError('Please provide some feedback');
      return;
    }
    
    if (feedback.length < 20) {
      setError('Feedback should be at least 20 characters');
      return;
    }
    
    setError('');
    
    try {
      await onSubmit(rating, feedback);
      // Form will be reset by parent component after successful submission
    } catch (err) {
      setError('Failed to submit review. Please try again.');
      console.error('Error submitting review:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900">Submit Your Review</h3>
      
      <div className="space-y-4">
        <RatingScale 
          rating={rating} 
          onChange={(newRating) => {
            setRating(newRating);
            if (error && rating === 0) setError('');
          }} 
        />
        
        <div>
          <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-1">
            Detailed Feedback
          </label>
          <textarea
            id="feedback"
            rows={5}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Share your thoughts on this profile. What works well? What could be improved? Be constructive and helpful."
            value={feedback}
            onChange={(e) => {
              setFeedback(e.target.value);
              if (error && !feedback.trim()) setError('');
            }}
          />
          <p className="mt-1 text-sm text-gray-500">
            Min 20 characters. Currently: {feedback.length} characters
          </p>
        </div>
        
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isSubmitting}
          className={`px-4 py-2 text-white font-medium rounded-md ${
            isSubmitting 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          }`}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
} 
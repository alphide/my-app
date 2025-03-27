'use client';

import React from 'react';
import Link from 'next/link';

interface NotificationBadgeProps {
  count: number;
  href: string;
}

export default function NotificationBadge({ count, href }: NotificationBadgeProps) {
  if (count <= 0) return null;
  
  return (
    <Link href={href} className="relative inline-block">
      <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
        {count > 9 ? '9+' : count}
      </div>
      <svg 
        className="h-6 w-6 text-gray-600 hover:text-primary transition-colors" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      >
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
      </svg>
    </Link>
  );
} 
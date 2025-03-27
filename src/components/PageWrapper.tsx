'use client';
import React from 'react';
import dynamic from 'next/dynamic';

// Load Navbar only on client-side
const DynamicNavbar = dynamic(() => import('./ClientNavBar'), {
  ssr: false,
});

export default function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <DynamicNavbar />
      <div className="mt-24">
        {children}
      </div>
    </>
  );
} 
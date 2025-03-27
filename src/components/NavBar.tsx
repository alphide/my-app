'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'

// Static placeholder that's shown during server-side rendering
function StaticNavBar() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center group">
          <span className="text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
            Vett
          </span>
        </div>
        <div className="flex gap-6">
          {/* Empty div for spacing */}
        </div>
      </nav>
    </header>
  )
}

// The interactive NavBar that is only loaded on the client
const ClientNavBar = dynamic(() => import('./ClientNavBar'), { 
  ssr: false,
  loading: () => <StaticNavBar />
})

export default function NavBar() {
  return <ClientNavBar />
} 
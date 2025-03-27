'use client'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

export default function ClientNavBar() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-sm">
      <nav className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center group">
          <span className="text-7xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent logo-gradient">
            Vett
          </span>
        </Link>
        
        <div className="flex gap-6">
          <Link href="/login" className="nav-link">Sign In</Link>
          <Link href="/signup" className="nav-link">Sign Up</Link>
        </div>
      </nav>
    </header>
  )
} 
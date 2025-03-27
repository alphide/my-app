'use client';
import Link from 'next/link'
import AnimatedSection from '@/components/AnimatedSection'
import GetStartedButton from '@/components/GetStartedButton'
import PageWrapper from '@/components/PageWrapper'

export default function Home() {
  return (
    <PageWrapper>
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="relative">
            <h1 className="text-6xl font-bold text-center mb-8">
              <span className="block text-left mb-4 opacity-0 animate-fade-in">Forget dating gurus...</span>
              <span className="block text-right opacity-0 animate-fade-in-second">Let real women review your profile</span>
            </h1>
            <div className="flex justify-center mt-12">
              <GetStartedButton />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="min-h-screen flex items-center justify-center">
        <div className="container mx-auto px-4">
          <AnimatedSection>
            <div className="max-w-4xl mx-auto">
              <div className="text-center space-y-8">
                <h2 className="text-4xl font-bold animate-fade-in-section">How It Works</h2>
                <div className="space-y-6">
                  <p className="text-lg text-gray-700 animate-fade-in-section">
                    Men upload their dating profiles (screenshots & bios from Hinge/Tinder), and verified women review them by leaving feedback
                  </p>
                  <p className="text-lg text-gray-700 animate-fade-in-section">
                    Don't worry, we keep it constructive! Think of it as a "light roast" — just enough to help you improve, not enough to make you delete your account
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
                <div className="p-6 bg-white rounded-lg shadow-sm opacity-0 animate-fade-in-section-1">
                  <h3 className="text-center text-xl font-semibold mb-3">For Submitters</h3>
                  <p className="text-center text-gray-600">Upload your dating profile screenshots + bio</p>
                </div>
                <div className="p-6 bg-white rounded-lg shadow-sm opacity-0 animate-fade-in-section-2">
                  <h3 className="text-center text-xl font-semibold mb-3">For Reviewers</h3>
                  <p className="text-center text-gray-600">Verified women provide constructive feedback</p>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA Section */}
      <section className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-8">Ready to Get Started?</h2>
          <p className="text-xl mb-12">Join a growing community improving their profiles and finding real results.</p>
          <div className="flex justify-center gap-4">
            <Link href="/signup" className="btn-gradient animate-gradientFlow">
              Submit Your Profile
            </Link>
            <Link href="/signup" className="btn-outline hover:shadow-lg transition-shadow duration-300">
              Review Profiles
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-black text-white py-12 border-t border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <p className="text-sm text-gray-400">© 2025 Vett. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </PageWrapper>
  )
} 
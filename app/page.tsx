"use client"

import Image from "next/image"
import Link from "next/link"


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-keppel-50 to-cyan-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <Image 
                src="/images/logo-t.png" 
                alt="Company Logo" 
                width={120}
                height={60}
                className="h-12 w-auto object-contain"
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement
                  target.style.display = 'none'
                  const fallback = target.nextElementSibling as HTMLElement
                  if (fallback) {
                    fallback.style.display = 'block'
                  }
                }}
              />
              <div style={{ display: 'none' }} className="text-center">
                <h1 className="text-xl font-bold text-gray-700">RealtorAI</h1>
              </div>
          </div>
          <div className="flex space-x-4">
            <Link
              href="/auth/signin"
                className="text-gray-700 hover:text-keppel-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/pricing?signup=true"
                className="bg-keppel-500 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-keppel-600 transition-colors"
            >
              Get Started
            </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            AI-Powered Platform for Real Estate & Business
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Everything you need to manage leads, properties, and customers in one place. 
            Intelligent automation, powerful insights, and seamless communication.
          </p>
          <div className="flex justify-center">
            <Link
              href="/pricing?signup=true"
              className="bg-keppel-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-keppel-600 transition-colors shadow-lg"
            >
              Start Free Trial
            </Link>
          </div>
                </div>

        {/* Features Section - Two Columns */}
        <div className="mt-20">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-12">Powerful Tools for Your Business</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Realtor Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-keppel-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-keppel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Real Estate Professionals</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Property Management</strong> - Add and manage property listings with custom details</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Location Insights</strong> - Google Maps analysis with distance profiles and PDF reports</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Showing Tours</strong> - Plan and organize property tours efficiently</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>AI Lead Generation</strong> - Intelligent chatbot that qualifies leads and scores prospects</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Context Management</strong> - Store community and neighborhood knowledge</span>
                </li>
              </ul>
            </div>

            {/* Business Features */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-keppel-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-keppel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">For Business Owners</h3>
              </div>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Customer Management</strong> - Complete customer database with profiles and history</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Service Management</strong> - Define and manage your services and pricing</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Appointment Scheduling</strong> - Flexible calendar and list views for scheduling</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>AI Lead Generation</strong> - Intelligent chatbot that qualifies leads and scores prospects</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 text-keppel-500 mr-3 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-gray-700"><strong>Context Management</strong> - Store business information and customize chatbot responses</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Communications Add-On */}
          <div className="mt-12 bg-gradient-to-r from-keppel-50 to-cyan-50 rounded-xl shadow-lg p-8 max-w-4xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-keppel-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-keppel-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Communications Package</h3>
              <p className="text-gray-600 mb-6">Available as an add-on to any plan</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">Web Chat</h4>
                <p className="text-sm text-gray-600">Embeddable chatbot widget for your website</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">WhatsApp Integration</h4>
                <p className="text-sm text-gray-600">Connect WhatsApp Business and manage conversations</p>
              </div>
              <div className="text-center">
                <h4 className="font-semibold text-gray-900 mb-2">SMS & Voicemail</h4>
                <p className="text-sm text-gray-600">Two-way SMS messaging and voicemail management</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 text-center bg-white rounded-2xl shadow-xl p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-gray-600 mb-8">Join real estate professionals using our platform</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pricing?signup=true"
              className="bg-keppel-500 text-white px-8 py-4 rounded-lg text-lg font-medium hover:bg-keppel-600 transition-colors shadow-lg"
            >
              See All Plans & Pricing
            </Link>
            <Link
              href="/auth/signin"
              className="border-2 border-keppel-500 text-keppel-600 px-8 py-4 rounded-lg text-lg font-medium hover:bg-keppel-50 transition-colors"
            >
              Sign In to Your Account
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-300">© 2024 RealtorAI. All rights reserved.</p>
      </div>
      </footer>
    </div>
  )
}
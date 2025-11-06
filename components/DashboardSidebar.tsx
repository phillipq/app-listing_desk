'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'

interface DashboardSidebarProps {
  currentPage?: string
}

export default function DashboardSidebar({ currentPage }: DashboardSidebarProps) {
  const { data: session } = useSession()
  const pathname = usePathname()

  const navigationItems = [
    {
      href: '/dashboard',
      label: 'Dashboard',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z" />
        </svg>
      ),
      color: 'cerulean'
    },
    {
      href: '/dashboard/leads',
      label: 'Leads',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      color: 'indigo'
    },
    {
      href: '/dashboard/showing-tour',
      label: 'Showing Tour',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'licorice'
    },
    {
      href: '/dashboard/location-insights',
      label: 'Location Insights',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      ),
      color: 'keppel'
    },
    {
      href: '/dashboard/listings',
      label: 'Property Listings',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      ),
      color: 'verdigris'
    },
    {
      href: '/dashboard/properties/manual',
      label: 'Manual Properties',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      color: 'eggplant'
    },
    {
      href: '/dashboard/facebook-groups',
      label: 'Facebook Groups',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
        </svg>
      ),
      color: 'purple'
    },
    {
      href: '/dashboard/test-geocoding',
      label: 'Test Geocoding',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      color: 'indigo'
    },
    {
      href: '/dashboard/deployment',
      label: 'Deployment',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      color: 'cerulean'
    },
    {
      href: '/dashboard/settings',
      label: 'Settings',
      icon: (
        <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      color: 'cerulean'
    }
  ]

  const getColorClasses = (color: string, isActive: boolean) => {
    const baseClasses = "flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
    
    if (isActive) {
      // All active states use keppel-500 with opacity
      return `${baseClasses} text-gray-700 bg-keppel-500 bg-opacity-10`
    } else {
      // All hover states use keppel-100 (light keppel)
      return `${baseClasses} text-gray-700 hover:text-gray-700 hover:bg-keppel-100`
    }
  }

  const isActive = (href: string) => {
    if (currentPage) {
      return currentPage === href
    }
    return pathname === href
  }

  return (
    <div className="w-56 bg-white shadow-soft-lg border-r border-gray-100 flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-center">
          <div className="relative">
            <Image 
              src="/images/logo-t.png" 
              alt="Company Logo" 
              width={180}
              height={90}
              className="h-44 w-auto object-contain"
              onError={(e) => {
                // Fallback to text if logo doesn't exist
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                const fallback = target.nextElementSibling as HTMLElement
                if (fallback) {
                  fallback.style.display = 'block'
                }
              }}
            />
            <div style={{ display: 'none' }} className="text-center">
              <h1 className="text-lg font-bold text-gray-700">Dashboard</h1>
              <p className="text-xs text-gray-500 mt-1">Welcome back, {session?.user?.name || session?.user?.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={getColorClasses(item.color, isActive(item.href))}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
      </nav>


      {/* User Info and Logout */}
      <div className="p-3 border-t border-gray-100">
        {/* User Info */}
        <div className="mb-3 px-2">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-keppel-500 shadow-soft-sm flex items-center justify-center">
              <span className="text-sm font-medium text-seasalt-500">
                {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-gray-500">
                {session?.user?.email}
              </p>
            </div>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={() => signOut({ callbackUrl: '/auth/signin' })}
          className="flex items-center justify-center w-full bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200 text-sm font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  )
}

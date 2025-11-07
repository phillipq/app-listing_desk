'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import DashboardWithChatbot from '@/components/DashboardWithChatbot'
// DashboardLayout is now handled by the parent layout

interface DashboardStats {
  totalSessions: number
  leadReadyLeads: number
  totalLeads: number
}

interface Lead {
  id: string
  sessionId: string
  email: string | null
  phone: string | null
  name: string | null
  leadScore: number
  isQualified: boolean
  createdAt: string
  lastActivity: string
}

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingAdmin, setCheckingAdmin] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    const checkAdminStatus = async () => {
      try {
        const response = await fetch('/api/debug/session')
        if (response.ok) {
          const data = await response.json() as { adminStatus?: boolean }
          if (data.adminStatus) {
            router.push('/admin')
            return
          }
        }
      } catch (error) {
        console.error('Error checking admin status:', error)
      }
      setCheckingAdmin(false)
      fetchStats()
    }

    checkAdminStatus()
  }, [session, status, router])

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats')
      const data = await response.json() as {
        totalProperties?: number
        totalSessions: number
        leadReadyLeads: number
        totalLeads: number
        leads: Lead[]
      }
      
      if (response.ok) {
        setStats({
          totalSessions: data.totalSessions,
          leadReadyLeads: data.leadReadyLeads,
          totalLeads: data.totalLeads
        })
        setLeads(data.leads || [])
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading || checkingAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardWithChatbot>
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-keppel-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {stats?.totalSessions || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-keppel-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Lead Ready</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {stats?.leadReadyLeads || 0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-keppel-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                  <svg className="w-5 h-5 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Leads</p>
                <p className="text-2xl font-semibold text-gray-700">
                  {stats?.totalLeads || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Leads Summary */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Recent Leads</h2>
            <Link
              href="/dashboard/leads"
              className="text-gray-700 hover:text-gray-700 font-medium"
            >
              View All Leads →
            </Link>
          </div>
          {leads.length > 0 ? (
            <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {leads.slice(0, 6).map((lead) => (
                  <div 
                    key={lead.id}
                    className="p-4 border border-gray-200 rounded-lg hover:shadow-soft-sm transition-all duration-200 cursor-pointer"
                    onClick={() => router.push(`/dashboard/leads/${lead.sessionId}`)}
                  >
                    <div className="flex items-center mb-3">
                      <div className="h-8 w-8 rounded-full bg-keppel-500 shadow-soft-sm flex items-center justify-center">
                        <span className="text-sm font-medium text-seasalt-500">
                          {lead.name ? lead.name.charAt(0).toUpperCase() : '?'}
                        </span>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-700">
                          {lead.name || 'Anonymous'}
                        </div>
                        <div className="text-xs text-gray-500">
                          {lead.email || lead.phone || 'No contact info'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        lead.isQualified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.isQualified ? 'Qualified' : 'Pending'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {lead.leadScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <div className="text-gray-500 text-6xl mb-4">👥</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No leads yet</h3>
              <p className="text-gray-500 mb-4">
                Start conversations with potential clients using your chatbot to see leads appear here.
              </p>
              <Link
                href={`/?realtorId=${session?.user?.id}`}
                className="inline-flex items-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-md hover:shadow-soft-md transition-all duration-200"
              >
                View Chatbot
              </Link>
            </div>
          )}
        </div>
      </div>
    </DashboardWithChatbot>
  )
}

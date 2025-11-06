'use client'

import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
// DashboardLayout is now handled by the parent layout

interface RealtorProfile {
  id: string
  name: string
  email: string
  domain: string
  isAdmin: boolean
  isActive: boolean
  apiKey: string
  bookingUrl?: string
  createdAt: string
  updatedAt: string
  propertiesCount: number
  sessionsCount: number
}

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<RealtorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: '',
    bookingUrl: '',
    password: '',
    currentPassword: ''
  })

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchProfile()
  }, [session, status, router])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/realtor/profile')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json() as { 
        realtor: RealtorProfile
      }
      setProfile(data.realtor)
      setFormData({
        name: data.realtor.name,
        email: data.realtor.email,
        domain: data.realtor.domain,
        bookingUrl: data.realtor.bookingUrl || '',
        password: '',
        currentPassword: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await fetch('/api/realtor/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json() as { 
        success: boolean
        error?: string
      }
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setSuccess('Settings updated successfully!')
      setFormData({
        ...formData,
        password: '',
        currentPassword: ''
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading settings...</p>
        </div>
      </div>
    )
  }

  if (!session || !profile) {
    return null
  }

  return (
    <div className="w-full">
      {/* Sticky Header with Actions */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-700">Settings</h1>
              <p className="text-sm text-gray-500">Manage your account, chatbot settings, and business information</p>
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
              <button
                type="submit"
                form="settings-form"
                disabled={saving}
                className="px-6 py-2 bg-keppel-500 text-seasalt-500 rounded-md hover:bg-keppel-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="px-4 py-2 bg-buff-500 text-seasalt-500 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">

        {/* Profile Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-700">{profile.propertiesCount}</div>
            <div className="text-gray-500">Properties</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-700">{profile.sessionsCount}</div>
            <div className="text-gray-500">Sessions</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-bold text-gray-700">
              {profile.isAdmin ? 'Admin' : 'Realtor'}
            </div>
            <div className="text-gray-500">Role</div>
          </div>
        </div>

        {/* Settings Form */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Account Settings</h2>
          </div>
          
          <form id="settings-form" onSubmit={handleSubmit} className="p-6 space-y-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-gray-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 border border-green-200 text-gray-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-keppel-500 focus:border-keppel-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-keppel-500 focus:border-keppel-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Domain</label>
                  <input
                    type="text"
                    required
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-keppel-500 focus:border-keppel-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">API Key</label>
                  <div className="mt-1 flex">
                    <input
                      type="text"
                      value={profile.apiKey}
                      readOnly
                      className="block w-full border border-gray-300 rounded-l-md px-3 py-2 bg-slate-50 text-gray-500"
                    />
                    <button
                      type="button"
                      onClick={() => navigator.clipboard.writeText(profile.apiKey)}
                      className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-slate-50 hover:bg-slate-100"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Settings */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Business Settings</h3>
              
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Booking URL</label>
                  <input
                    type="url"
                    value={formData.bookingUrl}
                    onChange={(e) => setFormData({ ...formData, bookingUrl: e.target.value })}
                    placeholder="https://calendly.com/yourname"
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-keppel-500 focus:border-keppel-500"
                  />
                  <p className="mt-1 text-sm text-gray-500">URL for scheduling appointments with clients</p>
                </div>
              </div>
            </div>

            {/* Password Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Change Password</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={formData.currentPassword}
                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-keppel-500 focus:border-keppel-500"
                    placeholder="Enter current password to change"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-keppel-500 focus:border-keppel-500"
                    placeholder="Enter new password"
                  />
                </div>
              </div>
            </div>

            {/* Account Info */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
                <div>
                  <span className="font-medium">Account ID:</span> {profile.id}
                </div>
                <div>
                  <span className="font-medium">Role:</span> {profile.isAdmin ? 'Administrator' : 'Realtor'}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {profile.isActive ? 'Active' : 'Inactive'}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {new Date(profile.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {new Date(profile.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}
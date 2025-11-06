'use client'

import { useRouter } from 'next/navigation'
import { signOut, useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import DashboardLayout from '@/components/DashboardLayout'

interface Realtor {
  id: string
  name: string
  email: string
  domain: string
  isAdmin: boolean
  isActive: boolean
  createdAt: string
  propertiesCount: number
  sessionsCount: number
}

interface AdminStats {
  total: number
  active: number
  admins: number
}

interface RealtorFormData {
  name: string
  email: string
  domain: string
  password?: string
  isAdmin: boolean
  isActive?: boolean
}

interface RealtorsResponse {
  realtors: Realtor[]
  total: number
  active: number
  admins: number
}

interface ApiResponse {
  success: boolean
  message?: string
  realtor?: Realtor
}

interface AdminCheckResponse {
  isAdmin: boolean
}

export default function AdminDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [realtors, setRealtors] = useState<Realtor[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedRealtor, setSelectedRealtor] = useState<Realtor | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    // Check if user is admin
    checkAdminStatus()
  }, [session, status, router])

  const checkAdminStatus = async () => {
    try {
      const response = await fetch('/api/admin/check-admin')
      if (response.ok) {
        const data = await response.json() as AdminCheckResponse
        setIsAdmin(data.isAdmin)
        if (data.isAdmin) {
          fetchRealtors()
        } else {
          router.push('/dashboard')
        }
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error checking admin status:', error)
      router.push('/dashboard')
    }
  }

  const fetchRealtors = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/realtors')
      
      if (!response.ok) {
        throw new Error('Failed to fetch realtors')
      }
      
      const data = await response.json() as RealtorsResponse
      setRealtors(data.realtors || [])
      setStats({
        total: data.total || 0,
        active: data.active || 0,
        admins: data.admins || 0
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch realtors')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRealtor = async (formData: RealtorFormData) => {
    try {
      setActionLoading(true)
      const response = await fetch('/api/admin/realtors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json() as ApiResponse
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create realtor')
      }

      setShowCreateModal(false)
      await fetchRealtors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create realtor')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateRealtor = async (formData: RealtorFormData) => {
    if (!selectedRealtor) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/realtors/${selectedRealtor.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json() as ApiResponse
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to update realtor')
      }

      setShowEditModal(false)
      setSelectedRealtor(null)
      await fetchRealtors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update realtor')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDeleteRealtor = async (realtorId: string) => {
    if (!confirm('Are you sure you want to delete this realtor? This action cannot be undone.')) {
      return
    }

    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/realtors/${realtorId}`, {
        method: 'DELETE'
      })

      const data = await response.json() as ApiResponse
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to delete realtor')
      }

      await fetchRealtors()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete realtor')
    } finally {
      setActionLoading(false)
    }
  }

  const openEditModal = (realtor: Realtor) => {
    setSelectedRealtor(realtor)
    setShowEditModal(true)
  }

  if (status === 'loading' || loading || isAdmin === null) {
    return (
      <DashboardLayout currentPage="/dashboard/admin">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading admin dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (isAdmin === false) {
    return (
      <DashboardLayout currentPage="/dashboard/admin">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-700 mb-2">Access Denied</h1>
            <p className="text-gray-500">You don't have admin privileges to access this page.</p>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-700 text-xl mb-4">❌ Error</div>
          <p className="text-gray-500">{error}</p>
          <button 
            onClick={fetchRealtors}
            className="mt-4 px-4 py-2 bg-keppel-500 text-seasalt-500 rounded hover:bg-keppel-500"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <DashboardLayout currentPage="/dashboard/admin">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-700">Admin Dashboard</h1>
              <p className="mt-2 text-gray-500">Manage realtors and system settings</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => router.push('/dashboard')}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md hover:bg-slate-50"
              >
                Back to Dashboard
              </button>
              <button
                onClick={() => signOut({ callbackUrl: '/auth/signin' })}
                className="px-4 py-2 bg-buff-500 text-seasalt-500 rounded-md hover:bg-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-700">{stats.total}</div>
              <div className="text-gray-500">Total Realtors</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-700">{stats.active}</div>
              <div className="text-gray-500">Active Realtors</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-gray-700">
                {realtors.reduce((sum, r) => sum + r.propertiesCount, 0)}
              </div>
              <div className="text-gray-500">Total Properties</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-bold text-orange-600">
                {realtors.reduce((sum, r) => sum + r.sessionsCount, 0)}
              </div>
              <div className="text-gray-500">Total Sessions</div>
            </div>
          </div>
        )}

        {/* Admin Users Info */}
        {stats && stats.admins > 0 && (
          <div className="mb-6 bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">{stats.admins} admin user{stats.admins !== 1 ? 's' : ''}</span> are system administrators and are excluded from the realtors list below.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-700">Realtors</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-lg hover:bg-keppel-500 transition-colors"
          >
            Add New Realtor
          </button>
        </div>

        {/* Realtors Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700">Realtors</h3>
            <p className="text-sm text-gray-500 mt-1">
              Admin users are excluded from this list as they are system administrators, not realtors with properties and sessions.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Realtor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sessions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {realtors.map((realtor) => (
                  <tr key={realtor.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-700">
                              {realtor.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-700">
                            {realtor.name}
                            {realtor.isAdmin && (
                              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                Admin
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{realtor.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {realtor.domain}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        realtor.isActive 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {realtor.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {realtor.propertiesCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {realtor.sessionsCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(realtor.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(realtor)}
                          className="text-gray-700 hover:text-blue-900"
                          disabled={actionLoading}
                        >
                          Edit
                        </button>
                        {!realtor.isAdmin && (
                          <button
                            onClick={() => handleDeleteRealtor(realtor.id)}
                            className="text-gray-700 hover:text-red-900"
                            disabled={actionLoading}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex justify-between">
          <div className="flex space-x-3">
            <button
              onClick={fetchRealtors}
              className="px-4 py-2 bg-gray-600 text-gray-700 rounded hover:bg-gray-700"
            >
              Refresh
            </button>
            <button
              onClick={() => router.push('/dashboard/settings')}
              className="px-4 py-2 bg-seasalt-500 text-gray-700 rounded hover:bg-purple-700"
            >
              Admin Settings
            </button>
            <button
              onClick={() => router.push('/dashboard/admin/populate-database')}
              className="px-4 py-2 bg-orange-600 text-gray-700 rounded hover:bg-orange-700"
            >
              Populate Database
            </button>
          </div>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-keppel-500 text-seasalt-500 rounded hover:bg-keppel-500"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Create Realtor Modal */}
        {showCreateModal && (
          <CreateRealtorModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateRealtor}
            loading={actionLoading}
          />
        )}

        {/* Edit Realtor Modal */}
        {showEditModal && selectedRealtor && (
          <EditRealtorModal
            realtor={selectedRealtor}
            onClose={() => {
              setShowEditModal(false)
              setSelectedRealtor(null)
            }}
            onSubmit={handleUpdateRealtor}
            loading={actionLoading}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

// Create Realtor Modal Component
function CreateRealtorModal({ onClose, onSubmit, loading }: {
  onClose: () => void
  onSubmit: (data: RealtorFormData) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    domain: '',
    password: '',
    isAdmin: false
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Create New Realtor</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Domain</label>
            <input
              type="text"
              required
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isAdmin"
              checked={formData.isAdmin}
              onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
              className="mr-2"
            />
            <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
              Admin privileges
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-keppel-500 text-seasalt-500 rounded hover:bg-keppel-500 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Edit Realtor Modal Component
function EditRealtorModal({ realtor, onClose, onSubmit, loading }: {
  realtor: Realtor
  onClose: () => void
  onSubmit: (data: RealtorFormData) => void
  loading: boolean
}) {
  const [formData, setFormData] = useState({
    name: realtor.name,
    email: realtor.email,
    domain: realtor.domain,
    password: '',
    isAdmin: realtor.isAdmin,
    isActive: realtor.isActive
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: RealtorFormData = { ...formData }
    if (!data.password) {
      const { password: _password, ...dataWithoutPassword } = data
      onSubmit(dataWithoutPassword)
    } else {
      onSubmit(data)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">Edit Realtor</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Domain</label>
            <input
              type="text"
              required
              value={formData.domain}
              onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password (leave blank to keep current)</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isAdmin"
                checked={formData.isAdmin}
                onChange={(e) => setFormData({ ...formData, isAdmin: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isAdmin" className="text-sm font-medium text-gray-700">
                Admin privileges
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="mr-2"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                Active
              </label>
            </div>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-keppel-500 text-seasalt-500 rounded hover:bg-keppel-500 disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

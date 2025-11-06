'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import CalendarView from '@/components/CalendarView'

interface Appointment {
  id: string
  customerId: string
  serviceId: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  customer: {
    id: string
    name: string
    email: string | null
    phone: string | null
  }
  service: {
    id: string
    name: string
    price: number
  }
}

interface DashboardStats {
  appointments: {
    total: number
    thisMonth: number
    confirmed: number
    upcoming: Appointment[]
  }
  services: {
    total: number
    active: number
  }
  customers: {
    total: number
    active: number
    newThisMonth: number
  }
  revenue: {
    thisMonth: number
  }
}

export default function SchedulingPage() {
  const { data: session } = useSession()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null)
  
  // Load default view from localStorage or default to 'list'
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scheduling-default-view')
      return (saved === 'list' || saved === 'calendar') ? saved : 'list'
    }
    return 'list'
  })

  useEffect(() => {
    if (session) {
      fetchAppointments()
      fetchStats()
    }
  }, [session])

  // Save view preference when it changes
  const handleViewModeChange = (mode: 'list' | 'calendar') => {
    setViewMode(mode)
    if (typeof window !== 'undefined') {
      localStorage.setItem('scheduling-default-view', mode)
    }
  }

  const fetchAppointments = async () => {
    try {
      const response = await fetch('/api/crm/appointments')
      const data = await response.json() as { appointments?: Appointment[] }
      setAppointments(data.appointments || [])
    } catch (error) {
      console.error('Error fetching appointments:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/crm/dashboard')
      const data = await response.json() as DashboardStats
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this appointment?')) return

    try {
      const response = await fetch(`/api/crm/appointments/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setAppointments(appointments.filter(a => a.id !== id))
        fetchStats() // Refresh stats
      }
    } catch (error) {
      console.error('Error deleting appointment:', error)
    }
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Scheduling</h1>
            <p className="text-gray-500 mt-2">Manage your appointments and schedule</p>
          </div>
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleViewModeChange('list')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white text-keppel-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  List View
                </button>
                <button
                  onClick={() => handleViewModeChange('calendar')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'calendar'
                      ? 'bg-white text-keppel-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Calendar View
                </button>
              </div>
              <div className="text-xs text-gray-500">
                (saved as default)
              </div>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-lg hover:bg-keppel-600 transition-colors"
            >
              New Appointment
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {!stats ? (
          // Loading skeleton
          <>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse"></div>
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
        <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-keppel-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-seasalt-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Appointments</p>
              <p className="text-2xl font-semibold text-gray-700">{stats?.appointments?.total || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-green-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Confirmed</p>
              <p className="text-2xl font-semibold text-gray-700">{stats?.appointments?.confirmed || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">This Month</p>
              <p className="text-2xl font-semibold text-gray-700">{stats?.appointments?.thisMonth || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-soft-lg p-6 border border-gray-100">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-purple-500 rounded-xl shadow-soft-sm flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Monthly Revenue</p>
              <p className="text-2xl font-semibold text-gray-700">${stats?.revenue?.thisMonth || 0}</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Appointments View */}
      {viewMode === 'calendar' ? (
        <CalendarView 
          appointments={appointments}
          onAppointmentClick={(appointment) => setEditingAppointment(appointment)}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700">Upcoming Appointments</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keppel-500 mx-auto"></div>
                  <p className="mt-2 text-gray-500">Loading appointments...</p>
                </div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-700 mb-2">No appointments yet</h3>
                <p className="text-gray-500 mb-4">Get started by scheduling your first appointment</p>
                <button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-keppel-500 text-white px-4 py-2 rounded-lg hover:bg-keppel-600 transition-colors"
                >
                  Schedule Appointment
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.map((appointment) => {
                const appointmentDate = new Date(appointment.startTime)
                const formattedDate = appointmentDate.toLocaleDateString()
                const formattedTime = appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                const duration = Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60000)
                
                return (
                    <div key={appointment.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-soft-sm transition-shadow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-medium text-gray-700">{appointment.customer.name}</h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{appointment.service.name}</p>
                      <p className="text-sm text-gray-500 mb-1">{formattedDate} at {formattedTime}</p>
                      <p className="text-sm text-gray-500 mb-3">Duration: {duration} minutes</p>
                      {appointment.notes && (
                        <p className="text-sm text-gray-600 mb-3 italic">"{appointment.notes}"</p>
                      )}
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => setEditingAppointment(appointment)}
                          className="text-keppel-600 hover:text-keppel-900 text-sm"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => handleDelete(appointment.id)}
                          className="text-red-600 hover:text-red-900 text-sm"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Quick Actions</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-keppel-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-700">Book Appointment</p>
                <p className="text-sm text-gray-500">Schedule a new meeting</p>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-700">View Calendar</p>
                <p className="text-sm text-gray-500">See full calendar view</p>
              </div>
            </button>

            <button className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-700">Export Schedule</p>
                <p className="text-sm text-gray-500">Download calendar data</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Add/Edit Appointment Modal */}
      {(showAddModal || editingAppointment) && (
        <AppointmentModal
          appointment={editingAppointment}
          onClose={() => {
            setShowAddModal(false)
            setEditingAppointment(null)
          }}
          onSave={(appointment) => {
            if (editingAppointment) {
              // Update existing appointment
              setAppointments(appointments.map(a => a.id === appointment.id ? appointment : a))
            } else {
              // Add new appointment
              setAppointments([appointment, ...appointments])
            }
            setShowAddModal(false)
            setEditingAppointment(null)
            fetchStats() // Refresh stats
          }}
        />
      )}
    </div>
  )
}

// Appointment Modal Component
function AppointmentModal({ 
  appointment, 
  onClose, 
  onSave 
}: { 
  appointment: Appointment | null
  onClose: () => void
  onSave: (appointment: Appointment) => void
}) {
  interface CustomerSummary { id: string; name: string; email?: string | null; phone?: string | null }
  interface ServiceSummary { id: string; name: string; price: number }
  const [customers, setCustomers] = useState<CustomerSummary[]>([])
  const [services, setServices] = useState<ServiceSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    customerId: appointment?.customerId || '',
    serviceId: appointment?.serviceId || '',
    scheduledAt: appointment?.startTime ? new Date(appointment.startTime).toISOString().slice(0, 16) : '',
    duration: appointment?.startTime && appointment?.endTime ? 
      Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60000) : 60,
    status: appointment?.status || 'pending',
    notes: appointment?.notes || ''
  })

  useEffect(() => {
    fetchCustomersAndServices()
  }, [])

  const fetchCustomersAndServices = async () => {
    try {
      const [customersRes, servicesRes] = await Promise.all([
        fetch('/api/crm/customers'),
        fetch('/api/crm/services')
      ])
      
      const customersData = await customersRes.json() as { customers?: CustomerSummary[] }
      const servicesData = await servicesRes.json() as { services?: ServiceSummary[] }
      
      setCustomers(customersData.customers || [])
      setServices(servicesData.services || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(
        appointment ? `/api/crm/appointments/${appointment.id}` : '/api/crm/appointments',
        {
          method: appointment ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json() as { appointment?: Appointment; message?: string }
      
      if (response.ok) {
        if (data.appointment) onSave(data.appointment)
      } else {
        alert(`Error: ${data.message || 'Failed to save appointment'}`)
      }
    } catch (error) {
      console.error('Error saving appointment:', error)
      alert('Error saving appointment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4">
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">
            {appointment ? 'Edit Appointment' : 'Schedule New Appointment'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer *</label>
              <select
                required
                value={formData.customerId}
                onChange={(e) => setFormData({ ...formData, customerId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email ? `(${customer.email})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service *</label>
              <select
                required
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="">Select a service</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name} (${service.price})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time *</label>
              <input
                type="datetime-local"
                required
                value={formData.scheduledAt}
                onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes) *</label>
              <input
                type="number"
                required
                min="15"
                max="480"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes about this appointment..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-keppel-500 text-white rounded-lg hover:bg-keppel-600 disabled:opacity-50"
            >
              {saving ? 'Saving...' : (appointment ? 'Update Appointment' : 'Schedule Appointment')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

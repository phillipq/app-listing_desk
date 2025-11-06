'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function ServicesPage() {
  const { data: session } = useSession()
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)

  useEffect(() => {
    if (session) {
      fetchServices()
    }
  }, [session])

  const fetchServices = async () => {
    try {
      const response = await fetch('/api/crm/services')
      const data = await response.json() as { services?: Service[] }
      setServices(data.services || [])
    } catch (error) {
      console.error('Error fetching services:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return

    try {
      const response = await fetch(`/api/crm/services/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setServices(services.filter(s => s.id !== id))
      }
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  if (loading) {
    return (
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading services...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-700">Services</h1>
            <p className="text-gray-500 mt-2">Manage your business services and pricing</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-lg hover:bg-keppel-600 transition-colors"
          >
            Add Service
          </button>
        </div>
      </div>

      {/* Services List */}
      <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-700">Service List</h2>
        </div>
        <div className="p-6">
          {services.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No services yet</h3>
              <p className="text-gray-500 mb-4">Get started by adding your first service</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="bg-keppel-500 text-white px-4 py-2 rounded-lg hover:bg-keppel-600 transition-colors"
              >
                Add Service
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => (
                <div key={service.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-soft-sm transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">{service.name}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      service.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {service.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  
                  {service.description && (
                    <p className="text-gray-600 mb-4">{service.description}</p>
                  )}
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Price:</span>
                      <span className="text-sm font-medium text-gray-700">${service.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Duration:</span>
                      <span className="text-sm font-medium text-gray-700">{service.duration} min</span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setEditingService(service)}
                      className="flex-1 text-keppel-600 hover:text-keppel-900 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(service.id)}
                      className="flex-1 text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Service Modal */}
      {(showAddModal || editingService) && (
        <ServiceModal
          service={editingService}
          onClose={() => {
            setShowAddModal(false)
            setEditingService(null)
          }}
          onSave={(service) => {
            if (editingService) {
              // Update existing service
              setServices(services.map(s => s.id === service.id ? service : s))
            } else {
              // Add new service
              setServices([service, ...services])
            }
            setShowAddModal(false)
            setEditingService(null)
          }}
        />
      )}
    </div>
  )
}

// Service Modal Component
function ServiceModal({ 
  service, 
  onClose, 
  onSave 
}: { 
  service: Service | null
  onClose: () => void
  onSave: (service: Service) => void
}) {
  const [formData, setFormData] = useState({
    name: service?.name || '',
    description: service?.description || '',
    price: service?.price || 0,
    duration: service?.duration || 60,
    isActive: service?.isActive ?? true
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(
        service ? `/api/crm/services/${service.id}` : '/api/crm/services',
        {
          method: service ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        }
      )

      const data = await response.json() as { service?: Service; message?: string }
      
      if (response.ok) {
        if (data.service) onSave(data.service)
      } else {
        alert(`Error: ${data.message || 'Failed to save service'}`)
      }
    } catch (error) {
      console.error('Error saving service:', error)
      alert('Error saving service. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">
            {service ? 'Edit Service' : 'Add New Service'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Service Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              placeholder="e.g., Consultation, Website Design, Marketing Strategy"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              placeholder="Describe what this service includes..."
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
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
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-keppel-600 focus:ring-keppel-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Service is active and available for booking
            </label>
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
              {saving ? 'Saving...' : (service ? 'Update Service' : 'Add Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
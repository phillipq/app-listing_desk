'use client'

import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
// DistanceProfileTab component not available
import AddPropertyForm from '@/components/AddPropertyForm'
// DashboardLayout is now handled by the parent layout
import EditPropertyForm from '@/components/EditPropertyForm'

interface ManualProperty {
  id: string
  mlsId: string
  address: string
  city: string
  province: string
  postalCode?: string
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  description?: string
  squareFootage?: number
  yearBuilt?: number
  lotSize?: number
  latitude?: number
  longitude?: number
  status: string
  createdAt: string
  updatedAt: string
}

interface Pagination {
  page: number
  limit: number
  total: number
  pages: number
}

export default function ManualPropertiesPage() {
  const { data: _session } = useSession()
  const _router = useRouter()
  const [properties, setProperties] = useState<ManualProperty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedProperty, setSelectedProperty] = useState<ManualProperty | null>(null)
  const [showPropertyDetails, setShowPropertyDetails] = useState(false)

  useEffect(() => {
    fetchProperties()
  }, [])

  const fetchProperties = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/property/manual')
      if (!response.ok) {
        throw new Error('Failed to fetch properties')
      }
      const data = await response.json() as { properties?: ManualProperty[], pagination?: Pagination }
      setProperties(data.properties || [])
      setPagination(data.pagination || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteProperty = async (id: string) => {
    if (!confirm('Are you sure you want to delete this property?')) {
      return
    }

    try {
      const response = await fetch(`/api/property/manual/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete property')
      }

      await fetchProperties()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleEditProperty = (property: ManualProperty) => {
    setSelectedProperty(property)
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    fetchProperties()
    setShowEditForm(false)
    setSelectedProperty(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  const _formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading manual properties...</p>
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
              <h1 className="text-3xl font-bold text-gray-700">Manual Properties</h1>
              <p className="mt-2 text-gray-500">
                Manage your manually added properties
              </p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200"
              >
                Add Property
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Properties List - Only show when not viewing property details */}
        {!showPropertyDetails && (
          <>
            {properties.length === 0 ? (
              <div className="text-center py-12">
                <svg className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-700">No properties</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by adding a new property.</p>
                <div className="mt-6">
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-xl shadow-soft-sm hover:shadow-soft-md transition-all duration-200"
                  >
                    Add Property
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-soft-lg border border-gray-100 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Property
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Beds/Baths
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {properties.map((property) => (
                      <tr 
                        key={property.id} 
                        className="hover:bg-slate-50 cursor-pointer transition-colors duration-200"
                        onClick={() => {
                          setSelectedProperty(property)
                          setShowPropertyDetails(true)
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-700">
                              {property.address}
                            </div>
                            <div className="text-sm text-gray-500">
                              {property.city}, {property.province}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-700">
                            {formatPrice(property.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {property.propertyType}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700">
                            {property.bedrooms} bed / {property.bathrooms} bath
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            {property.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditProperty(property)
                              }}
                              className="text-keppel-600 hover:text-keppel-900 transition-colors duration-200 p-1 rounded-md hover:bg-keppel-50"
                              title="Edit property"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteProperty(property.id)
                              }}
                              className="text-red-600 hover:text-red-900 transition-colors duration-200 p-1 rounded-md hover:bg-red-50"
                              title="Delete property"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} properties
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      if (pagination.page > 1) {
                        fetchProperties()
                      }
                    }}
                    disabled={pagination.page === 1}
                    className="px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm text-sm font-medium text-gray-700 bg-white hover:bg-slate-50 hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Previous
                  </button>
                  <span className="px-3 py-2 text-sm text-gray-700">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <button
                    onClick={() => {
                      if (pagination.page < pagination.pages) {
                        fetchProperties()
                      }
                    }}
                    disabled={pagination.page === pagination.pages}
                    className="px-3 py-2 border border-gray-200 rounded-xl shadow-soft-sm text-sm font-medium text-gray-700 bg-white hover:bg-slate-50 hover:shadow-soft-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Property Details - Replaces the properties list */}
        {showPropertyDetails && selectedProperty && (
          <div className="bg-seasalt-500 rounded-xl shadow-soft-lg border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-700">Property Details</h2>
                <p className="text-gray-500 mt-1">{selectedProperty.address}</p>
              </div>
              <button
                onClick={() => {
                  setShowPropertyDetails(false)
                  setSelectedProperty(null)
                }}
                className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
              >
                ← Back to Properties
              </button>
            </div>

            {/* Property Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-soft-sm border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Basic Information</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">MLS ID:</span>
                    <span className="font-medium">{selectedProperty.mlsId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Price:</span>
                    <span className="font-medium">${selectedProperty.price.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Type:</span>
                    <span className="font-medium">{selectedProperty.propertyType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Status:</span>
                    <span className="font-medium">{selectedProperty.status}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft-sm border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Property Details</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bedrooms:</span>
                    <span className="font-medium">{selectedProperty.bedrooms}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bathrooms:</span>
                    <span className="font-medium">{selectedProperty.bathrooms}</span>
                  </div>
                  {selectedProperty.squareFootage && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Square Feet:</span>
                      <span className="font-medium">{selectedProperty.squareFootage.toLocaleString()}</span>
                    </div>
                  )}
                  {selectedProperty.yearBuilt && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Year Built:</span>
                      <span className="font-medium">{selectedProperty.yearBuilt}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-soft-sm border border-gray-100 p-4">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Location</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Address:</span>
                    <span className="font-medium text-right">{selectedProperty.address}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">City:</span>
                    <span className="font-medium">{selectedProperty.city}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Province:</span>
                    <span className="font-medium">{selectedProperty.province}</span>
                  </div>
                  {selectedProperty.postalCode && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Postal Code:</span>
                      <span className="font-medium">{selectedProperty.postalCode}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Location Insights - Coming Soon */}
            {selectedProperty.latitude && selectedProperty.longitude && (
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Location Insights</h3>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700">Location insights feature coming soon! This will show nearby amenities, schools, and other points of interest.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Add Property Form */}
        {showAddForm && (
          <AddPropertyForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              fetchProperties()
              setShowAddForm(false)
            }}
          />
        )}

        {/* Edit Property Form */}
        {showEditForm && selectedProperty && (
          <EditPropertyForm
            property={selectedProperty}
            onClose={() => {
              setShowEditForm(false)
              setSelectedProperty(null)
            }}
            onSuccess={handleEditSuccess}
          />
        )}
      </div>
    
  )
}
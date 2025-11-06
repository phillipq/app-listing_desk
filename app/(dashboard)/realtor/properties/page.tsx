"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { useEffect, useState } from "react"
import AddPropertyForm from "@/components/AddPropertyForm"
// DashboardLayout is now handled by the parent layout

interface Property {
  id: string
  mlsId?: string
  mlsNumber?: string
  address: string
  city: string
  province: string
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  squareFootage?: number
  status: string
  images: string[]
  description?: string
  listDate?: string
  daysOnMarket?: number
  source: 'mls' | 'facebook' | 'manual'
  facebookGroupId?: string
  facebookPostId?: string
}

interface ListingsResponse {
  success: boolean
  properties: Property[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Property[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showAddForm, setShowAddForm] = useState(false)
  const [vectorSearchQuery, setVectorSearchQuery] = useState('')
  const [isVectorSearching, setIsVectorSearching] = useState(false)
  const [vectorSearchResults, setVectorSearchResults] = useState<Property[] | null>(null)
  const [filters, setFilters] = useState({
    city: '',
    province: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    maxBedrooms: '',
    propertyType: '',
    status: 'active',
    source: 'all'
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchListings()
  }, [session, status, router, currentPage])

  const fetchListings = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams()
      
      if (filters.city) params.append('city', filters.city)
      if (filters.province) params.append('province', filters.province)
      if (filters.minPrice) params.append('minPrice', filters.minPrice)
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice)
      if (filters.minBedrooms) params.append('minBedrooms', filters.minBedrooms)
      if (filters.maxBedrooms) params.append('maxBedrooms', filters.maxBedrooms)
      if (filters.propertyType) params.append('propertyType', filters.propertyType)
      if (filters.status) params.append('status', filters.status)
      if (filters.source) params.append('source', filters.source)
      
      params.append('page', currentPage.toString())
      params.append('limit', '12')

      const response = await fetch(`/api/properties/listings?${params.toString()}`)
      if (response.ok) {
        const data = await response.json() as ListingsResponse
        setListings(data.properties)
        setTotalPages(data.pagination.pages)
      }
    } catch (error) {
      console.error("Failed to fetch listings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handlePropertyClick = (property: Property) => {
    router.push(`/realtor/properties/${property.mlsId}`)
  }

  const applyFilters = () => {
    setCurrentPage(1)
    fetchListings()
  }

  const clearFilters = () => {
    setFilters({
      city: '',
      province: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      maxBedrooms: '',
      propertyType: '',
      status: 'active',
      source: 'all'
    })
    setCurrentPage(1)
  }

  const handleVectorSearch = async () => {
    if (!vectorSearchQuery.trim()) {
      setVectorSearchResults(null)
      return
    }

    setIsVectorSearching(true)
    try {
      const response = await fetch('/api/properties/vector-search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: vectorSearchQuery,
          limit: 20
        })
      })

      if (response.ok) {
        const data = await response.json() as { properties: Property[], totalMatches: number }
        setVectorSearchResults(data.properties)
      } else {
        console.error('Vector search failed')
        setVectorSearchResults([])
      }
    } catch (error) {
      console.error('Vector search error:', error)
      setVectorSearchResults([])
    } finally {
      setIsVectorSearching(false)
    }
  }

  const clearVectorSearch = () => {
    setVectorSearchQuery('')
    setVectorSearchResults(null)
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price)
  }

  if (isLoading && listings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-keppel-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading MLS listings...</p>
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
              <h1 className="text-3xl font-bold text-gray-700">Property Listings</h1>
              <p className="mt-2 text-gray-500">
                View and manage all your property listings from MLS, Facebook groups, and manual entries.
              </p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-md hover:bg-keppel-600 transition-colors"
              >
                + Add Property
              </button>
              <button
                onClick={() => fetchListings()}
                className="bg-gray-600 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                Refresh Listings
              </button>
            </div>
          </div>
        </div>

        {/* Vector Search */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">AI-Powered Property Search</h2>
          <p className="text-sm text-gray-500 mb-4">
            Search for properties using natural language. Try queries like "find me properties with a big yard" or "show me affordable homes near schools"
          </p>
          <div className="flex gap-4">
            <input
              type="text"
              value={vectorSearchQuery}
              onChange={(e) => setVectorSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleVectorSearch()
                }
              }}
              placeholder="e.g., 'find me properties with a big yard' or 'affordable homes near schools'"
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
            />
            <button
              onClick={handleVectorSearch}
              disabled={isVectorSearching || !vectorSearchQuery.trim()}
              className="bg-keppel-500 text-seasalt-500 px-6 py-3 rounded-md hover:bg-keppel-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVectorSearching ? 'Searching...' : 'Search'}
            </button>
            {vectorSearchResults !== null && (
              <button
                onClick={clearVectorSearch}
                className="bg-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-400 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          {vectorSearchResults !== null && vectorSearchResults.length === 0 && (
            <p className="mt-4 text-gray-500">No properties found matching your search.</p>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filter Listings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <input
                type="text"
                value={filters.city}
                onChange={(e) => handleFilterChange('city', e.target.value)}
                placeholder="Enter city"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <input
                type="text"
                value={filters.province}
                onChange={(e) => handleFilterChange('province', e.target.value)}
                placeholder="Enter province"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price</label>
              <input
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                placeholder="Min price"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
              <input
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                placeholder="Max price"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Bedrooms</label>
              <input
                type="number"
                value={filters.minBedrooms}
                onChange={(e) => handleFilterChange('minBedrooms', e.target.value)}
                placeholder="Min bedrooms"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Bedrooms</label>
              <input
                type="number"
                value={filters.maxBedrooms}
                onChange={(e) => handleFilterChange('maxBedrooms', e.target.value)}
                placeholder="Max bedrooms"
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
              <select
                value={filters.propertyType}
                onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="">All Types</option>
                <option value="house">House</option>
                <option value="condo">Condo</option>
                <option value="townhouse">Townhouse</option>
                <option value="duplex">Duplex</option>
                <option value="land">Land</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="active">Active</option>
                <option value="sold">Sold</option>
                <option value="pending">Pending</option>
                <option value="withdrawn">Withdrawn</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <select
                value={filters.source}
                onChange={(e) => handleFilterChange('source', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-keppel-500 focus:border-keppel-500"
              >
                <option value="all">All Sources</option>
                <option value="mls">MLS</option>
                <option value="facebook">Facebook</option>
                <option value="manual">Manual</option>
              </select>
            </div>
          </div>
          <div className="flex gap-4 mt-4">
            <button
              onClick={applyFilters}
              className="bg-keppel-500 text-seasalt-500 px-4 py-2 rounded-md hover:bg-keppel-500 transition-colors"
            >
              Apply Filters
            </button>
            <button
              onClick={clearFilters}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>

        {/* Properties Table */}
        {(vectorSearchResults !== null ? vectorSearchResults.length === 0 : listings.length === 0) ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 text-lg">No listings found.</p>
            <p className="text-gray-500 mt-2">Try adjusting your filters or add a new property.</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              {vectorSearchResults !== null && (
                <div className="p-4 bg-keppel-50 border-b border-keppel-200">
                  <p className="text-sm text-keppel-700">
                    Found {vectorSearchResults.length} properties matching "{vectorSearchQuery}"
                  </p>
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Image
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Address
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Price
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Details
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      {vectorSearchResults !== null && (
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Match Score
                        </th>
                      )}
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(vectorSearchResults !== null ? vectorSearchResults : listings).map((property) => (
                      <tr 
                        key={property.id} 
                        onClick={() => handlePropertyClick(property)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {property.images.length > 0 ? (
                            <div className="h-16 w-24 relative rounded overflow-hidden">
                              <Image
                                src={property.images[0] || '/placeholder-property.jpg'}
                                alt={property.address}
                                fill
                                className="object-cover"
                                sizes="96px"
                              />
                            </div>
                          ) : (
                            <div className="h-16 w-24 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No Image</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {property.address}
                          </div>
                          {property.mlsNumber && (
                            <div className="text-xs text-gray-500 mt-1">
                              MLS: {property.mlsNumber}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {property.city}, {property.province}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatPrice(property.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <div>{property.bedrooms} bed / {property.bathrooms} bath</div>
                            {property.squareFootage && (
                              <div className="text-xs text-gray-500">
                                {property.squareFootage.toLocaleString()} sq ft
                              </div>
                            )}
                            <div className="text-xs text-gray-500 capitalize mt-1">
                              {property.propertyType}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            property.status === 'active' ? 'bg-green-100 text-green-800' :
                            property.status === 'sold' ? 'bg-red-100 text-red-800' :
                            property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {property.status}
                          </span>
                          {property.daysOnMarket !== undefined && property.daysOnMarket > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {property.daysOnMarket} days
                            </div>
                          )}
                        </td>
                        {vectorSearchResults !== null && (
                          <td className="px-6 py-4 whitespace-nowrap">
                            {(() => {
                              const propertyWithScore = property as Property & { matchPercentage?: number }
                              const matchPercentage = propertyWithScore.matchPercentage
                              if (typeof matchPercentage === 'number') {
                                return (
                                  <div className="flex items-center">
                                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                      matchPercentage >= 80 ? 'bg-green-100 text-green-800' :
                                      matchPercentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {matchPercentage}%
                                    </span>
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </td>
                        )}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            property.source === 'mls' ? 'bg-blue-100 text-blue-800' :
                            property.source === 'facebook' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {property.source.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <nav className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        page === currentPage
                          ? 'bg-keppel-500 text-seasalt-500'
                          : 'text-gray-500 bg-white border border-gray-300 hover:bg-slate-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </nav>
              </div>
            )}
          </>
        )}

        {/* Add Property Form Modal */}
        {showAddForm && (
          <AddPropertyForm
            onClose={() => setShowAddForm(false)}
            onSuccess={() => {
              fetchListings()
              setShowAddForm(false)
            }}
          />
        )}
      </div>
  )
}

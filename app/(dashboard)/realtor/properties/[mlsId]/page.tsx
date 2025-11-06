'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import EditPropertyForm from '@/components/EditPropertyForm'

interface Brokerage {
  name?: string
}

interface Agent {
  name?: string
  position?: string
  phones?: string[]
  email?: string
  brokerage?: Brokerage
}

interface Room {
  description?: string
  level?: string
  features?: string
  features2?: string
}

interface AddressDetails {
  neighborhood?: string
  area?: string
  district?: string
  majorIntersection?: string
}

interface PropertyDetails {
  airConditioning?: string
  heating?: string
  exteriorConstruction1?: string
  style?: string
  flooringType?: string
  foundationType?: string
  roofMaterial?: string
  sewer?: string
  waterSource?: string
  zoning?: string
}

interface LotDetails {
  acres?: string
  squareFeet?: string
  legalDescription?: string
  features?: string
}

interface RawData {
  agents?: Agent[]
  rooms?: Room[]
  status?: string
  class?: string
  type?: string
  address?: AddressDetails
  propertyDetails?: PropertyDetails
  lotDetails?: LotDetails
  originalPrice?: number
  daysOnMarket?: number
  photoCount?: number
  [key: string]: unknown // Allow for flexible property structure
}

interface Property {
  id: string
  mlsId: string
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
  postalCode?: string
  neighborhood?: string
  yearBuilt?: number
  lotSize?: number
  parking?: string
  heating?: string
  cooling?: string
  virtualTour?: string
  latitude?: number | null
  longitude?: number | null
  rawData?: RawData
}

// Type guard function
const isAddressDetails = (address: unknown): address is AddressDetails => {
  return typeof address === 'object' && address !== null
}

// Address details component
const AddressDetailsSection = ({ address }: { address: AddressDetails }) => (
  <div className="mb-6">
    <h3 className="text-lg font-medium text-gray-700 mb-3">Address Details</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
      {address.neighborhood && (
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Neighborhood:</span>
          <span className="font-medium">{address.neighborhood}</span>
        </div>
      )}
      {address.area && (
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Area:</span>
          <span className="font-medium">{address.area}</span>
        </div>
      )}
      {address.district && (
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">District:</span>
          <span className="font-medium">{address.district}</span>
        </div>
      )}
      {address.majorIntersection && (
        <div className="flex justify-between py-2 border-b border-gray-100">
          <span className="text-gray-500">Major Intersection:</span>
          <span className="font-medium">{address.majorIntersection}</span>
        </div>
      )}
    </div>
  </div>
)

export default function PropertyDetailsPage({ params }: { params: Promise<{ mlsId: string }> }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [property, setProperty] = useState<Property | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [mlsId, setMlsId] = useState<string | null>(null)
  const [locationProfiles, setLocationProfiles] = useState<Array<{ id: string; profileName: string; createdAt: Date; totalAmenities: number }>>([])
  const [loadingProfiles, setLoadingProfiles] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)

  // Resolve params Promise
  useEffect(() => {
    params.then(resolvedParams => {
      setMlsId(resolvedParams.mlsId)
    })
  }, [params])

  useEffect(() => {
    if (status === 'loading' || !mlsId) return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchProperty()
  }, [session, status, router, mlsId])

  const fetchProperty = async () => {
    if (!mlsId) return
    
    try {
      setLoading(true)
      const response = await fetch(`/api/property/${mlsId}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Property not found')
        } else {
          setError('Failed to fetch property details')
        }
        return
      }
      
      const data = await response.json() as { property: Property }
      setProperty(data.property)
      
      // Fetch location insights profiles for this property
      if (data.property.mlsId) {
        fetchLocationProfiles(data.property.mlsId)
      }
    } catch {
      setError('Failed to fetch property details')
    } finally {
      setLoading(false)
    }
  }

  const fetchLocationProfiles = async (mlsId: string) => {
    try {
      setLoadingProfiles(true)
      const response = await fetch(`/api/property/${mlsId}/distance-profile/reports`)
      if (response.ok) {
        const profiles = await response.json() as Array<{
          id: string
          reportName: string
          generatedAt: string
          totalAmenities: number
        }>
        setLocationProfiles(profiles.map(p => ({
          id: p.id,
          profileName: p.reportName,
          createdAt: new Date(p.generatedAt),
          totalAmenities: p.totalAmenities
        })))
      }
    } catch (error) {
      console.error('Error fetching location profiles:', error)
    } finally {
      setLoadingProfiles(false)
    }
  }

  const handleEditSuccess = () => {
    fetchProperty()
    setShowEditForm(false)
  }

  const isManualProperty = property ? (property.mlsId?.startsWith('TLD') || (property.rawData && typeof property.rawData === 'object' && 'manualEntry' in property.rawData)) : false

  // Extract features from rawData if available
  const getFeatures = (): string[] => {
    if (!property?.rawData || typeof property.rawData !== 'object') return []
    const rawData = property.rawData as Record<string, unknown>
    if (Array.isArray(rawData.features)) {
      return rawData.features.filter((f): f is string => typeof f === 'string')
    }
    return []
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-keppel-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading property details...</p>
        </div>
      </div>
    )
  }

  if (error || !property) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-700 mb-4">Property Not Found</h1>
          <p className="text-gray-500 mb-6">{error || 'The requested property could not be found.'}</p>
          <Link
            href="/realtor/properties"
            className="px-6 py-2 bg-keppel-500 text-seasalt-500 rounded-md hover:bg-keppel-500"
          >
            Back to Listings
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/realtor/properties"
                className="text-gray-500 hover:text-gray-500"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-700">{property.address}</h1>
                <p className="text-gray-500">{property.city}, {property.province}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-700 mb-2">
                {formatPrice(property.price)}
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                property.status === 'active' ? 'bg-green-100 text-green-800' :
                property.status === 'sold' ? 'bg-red-100 text-red-800' :
                property.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-slate-100 text-gray-700'
              }`}>
                {property.status}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Property Images */}
        {property.images.length > 0 && (
          <div className="mb-8">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-gray-700">
                Property Images ({property.images.length})
              </h2>
            </div>
            
            {/* Main Image Display */}
            <div className="mb-4">
              <Image
                src={property.images[selectedImageIndex]!}
                alt={`${property.address} - Image ${selectedImageIndex + 1}`}
                width={800}
                height={384}
                className="w-full h-96 object-cover rounded-lg shadow-lg"
              />
            </div>

            {/* Thumbnail Gallery */}
            <div className="relative">
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                {property.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === index 
                        ? 'border-keppel-500 ring-2 ring-blue-200' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
              
              {/* Navigation Arrows */}
              <button
                onClick={() => setSelectedImageIndex(Math.max(0, selectedImageIndex - 1))}
                disabled={selectedImageIndex === 0}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 bg-white shadow-lg rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setSelectedImageIndex(Math.min(property.images.length - 1, selectedImageIndex + 1))}
                disabled={selectedImageIndex === property.images.length - 1}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 bg-white shadow-lg rounded-full p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Image Counter */}
            <div className="text-center text-sm text-gray-500 mt-2">
              {selectedImageIndex + 1} of {property.images.length}
            </div>
          </div>
        )}

        {/* Property Details Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Property Description */}
            {property.description && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Description</h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
            )}

            {/* Property Features */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Property Details</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Bedrooms</div>
                  <div className="text-2xl font-semibold">{property.bedrooms}</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Bathrooms</div>
                  <div className="text-2xl font-semibold">{property.bathrooms}</div>
                </div>
                {property.squareFootage && (
                  <div className="bg-slate-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-500">Square Feet</div>
                    <div className="text-2xl font-semibold">{property.squareFootage.toLocaleString()}</div>
                  </div>
                )}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Type</div>
                  <div className="text-2xl font-semibold capitalize">{property.propertyType}</div>
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-700 mb-4">Additional Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {property.yearBuilt && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Year Built:</span>
                    <span className="font-medium">{property.yearBuilt}</span>
                  </div>
                )}
                {property.lotSize && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Lot Size:</span>
                    <span className="font-medium">{property.lotSize.toLocaleString()} sq ft</span>
                  </div>
                )}
                {property.parking && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Parking:</span>
                    <span className="font-medium">{property.parking}</span>
                  </div>
                )}
                {property.heating && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Heating:</span>
                    <span className="font-medium">{property.heating}</span>
                  </div>
                )}
                {property.cooling && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Cooling:</span>
                    <span className="font-medium">{property.cooling}</span>
                  </div>
                )}
                {property.neighborhood && (
                  <div className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">Neighborhood:</span>
                    <span className="font-medium">{property.neighborhood}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Comprehensive Property Details from Raw Data */}
            {property.rawData && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Complete Property Details</h2>
                
                {/* Basic Property Info */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium text-gray-700 mb-3">Property Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    {property.rawData.status && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Status:</span>
                        <span className="font-medium">{property.rawData.status}</span>
                      </div>
                    )}
                    {property.rawData.class && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Class:</span>
                        <span className="font-medium">{property.rawData.class}</span>
                      </div>
                    )}
                    {property.rawData.type && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Type:</span>
                        <span className="font-medium">{property.rawData.type}</span>
                      </div>
                    )}
                    {property.rawData.originalPrice && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Original Price:</span>
                        <span className="font-medium">${property.rawData.originalPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {property.rawData.daysOnMarket && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Days on Market:</span>
                        <span className="font-medium">{property.rawData.daysOnMarket}</span>
                      </div>
                    )}
                    {property.rawData.photoCount && (
                      <div className="flex justify-between py-2 border-b border-gray-100">
                        <span className="text-gray-500">Photo Count:</span>
                        <span className="font-medium">{property.rawData.photoCount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Address Details */}
                {property.rawData.address && isAddressDetails(property.rawData.address) ? (
                  <AddressDetailsSection address={property.rawData.address as AddressDetails} />
                ) : null}

                {/* Property Details */}
                {property.rawData.propertyDetails && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Property Features</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {property.rawData.propertyDetails.airConditioning && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Air Conditioning:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.airConditioning}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.heating && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Heating:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.heating}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.exteriorConstruction1 && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Exterior Construction:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.exteriorConstruction1}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.style && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Style:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.style}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.flooringType && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Flooring:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.flooringType}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.foundationType && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Foundation:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.foundationType}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.roofMaterial && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Roof Material:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.roofMaterial}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.sewer && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Sewer:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.sewer}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.waterSource && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Water Source:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.waterSource}</span>
                        </div>
                      )}
                      {property.rawData.propertyDetails.zoning && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Zoning:</span>
                          <span className="font-medium">{property.rawData.propertyDetails.zoning}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Lot Information */}
                {property.rawData.lotDetails && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Lot Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {property.rawData.lotDetails?.acres && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Acres:</span>
                          <span className="font-medium">{property.rawData.lotDetails?.acres}</span>
                        </div>
                      )}
                      {property.rawData.lotDetails?.squareFeet && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Lot Square Feet:</span>
                          <span className="font-medium">{property.rawData.lotDetails?.squareFeet.toLocaleString()}</span>
                        </div>
                      )}
                      {property.rawData.lotDetails?.legalDescription && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Legal Description:</span>
                          <span className="font-medium">{property.rawData.lotDetails?.legalDescription}</span>
                        </div>
                      )}
                      {property.rawData.lotDetails?.features && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <span className="text-gray-500">Lot Features:</span>
                          <span className="font-medium">{property.rawData.lotDetails?.features}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Agent Information */}
                {property.rawData.agents && property.rawData.agents.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Agent Information</h3>
                    {property.rawData.agents.map((agent: Agent, index: number) => (
                      <div key={index} className="mb-4 p-4 bg-slate-50 rounded-lg">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500">Name:</span>
                            <span className="font-medium">{agent.name}</span>
                          </div>
                          <div className="flex justify-between py-2 border-b border-gray-200">
                            <span className="text-gray-500">Position:</span>
                            <span className="font-medium">{agent.position}</span>
                          </div>
                          {agent.phones && agent.phones.length > 0 && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-500">Phone:</span>
                              <span className="font-medium">{agent.phones[0]}</span>
                            </div>
                          )}
                          {agent.email && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-500">Email:</span>
                              <span className="font-medium">{agent.email}</span>
                            </div>
                          )}
                          {agent.brokerage && (
                            <div className="flex justify-between py-2 border-b border-gray-200">
                              <span className="text-gray-500">Brokerage:</span>
                              <span className="font-medium">{agent.brokerage.name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rooms Information */}
                {property.rawData.rooms && property.rawData.rooms.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-gray-700 mb-3">Room Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {property.rawData.rooms.map((room: Room, index: number) => (
                        <div key={index} className="p-3 bg-slate-50 rounded-lg">
                          <div className="text-sm">
                            <div className="font-medium text-gray-700">{room.description}</div>
                            <div className="text-gray-500 mt-1">Level: {room.level}</div>
                            {room.features && (
                              <div className="text-gray-500 mt-1">Features: {room.features}</div>
                            )}
                            {room.features2 && (
                              <div className="text-gray-500 mt-1">{room.features2}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* MLS Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">MLS Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">MLS Number:</span>
                  <span className="font-medium">{property.mlsNumber || property.mlsId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Property ID:</span>
                  <span className="font-medium text-sm">{property.id}</span>
                </div>
                {property.daysOnMarket && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Days on Market:</span>
                    <span className="font-medium">{property.daysOnMarket}</span>
                  </div>
                )}
                {property.listDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">List Date:</span>
                    <span className="font-medium">{new Date(property.listDate).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Location Information */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Location</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-sm text-gray-500">Address</div>
                  <div className="font-medium">{property.address}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-500">City, Province</div>
                  <div className="font-medium">{property.city}, {property.province}</div>
                </div>
                {property.postalCode && (
                  <div>
                    <div className="text-sm text-gray-500">Postal Code</div>
                    <div className="font-medium">{property.postalCode}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Virtual Tour */}
            {property.virtualTour && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Virtual Tour</h3>
                <a
                  href={property.virtualTour}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-md hover:bg-keppel-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h1m4 0h1m-6-8h1m4 0h1M9 6h1m4 0h1" />
                  </svg>
                  View Virtual Tour
                </a>
              </div>
            )}

            {/* Location Insights */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Location Insights</h3>
                {mlsId && (
                  <Link
                    href={`/realtor/location-insights?property=${mlsId}`}
                    className="text-sm text-keppel-600 hover:text-keppel-700 font-medium"
                  >
                    Manage Profiles →
                  </Link>
                )}
              </div>
              {loadingProfiles ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-keppel-500 mx-auto"></div>
                </div>
              ) : locationProfiles.length > 0 ? (
                <div className="space-y-3">
                  {locationProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div>
                        <div className="font-medium text-gray-700">{profile.profileName}</div>
                        <div className="text-sm text-gray-500">
                          {profile.totalAmenities} amenities • {profile.createdAt.toLocaleDateString()}
                        </div>
                      </div>
                      {mlsId && (
                        <Link
                          href={`/realtor/location-insights?property=${mlsId}&report=${profile.id}`}
                          className="text-sm text-keppel-600 hover:text-keppel-700 font-medium"
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  ))}
                  {mlsId && (
                    <Link
                      href={`/realtor/location-insights?property=${mlsId}`}
                      className="block w-full text-center px-4 py-2 bg-keppel-500 text-white rounded-md hover:bg-keppel-600 transition-colors mt-4"
                    >
                      Generate New Profile
                    </Link>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-gray-500 mb-4">No location insights profiles yet</p>
                  {mlsId && (
                    <Link
                      href={`/realtor/location-insights?property=${mlsId}`}
                      className="inline-block px-4 py-2 bg-keppel-500 text-white rounded-md hover:bg-keppel-600 transition-colors"
                    >
                      Generate First Profile
                    </Link>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Actions</h3>
              <div className="space-y-3">
                <Link
                  href="/realtor/properties"
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-gray-700 rounded-md hover:bg-gray-700"
                >
                  Back to Listings
                </Link>
                {isManualProperty && (
                  <button
                    onClick={() => setShowEditForm(true)}
                    className="w-full inline-flex items-center justify-center px-4 py-2 bg-keppel-500 text-seasalt-500 rounded-md hover:bg-keppel-600 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit Property
                  </button>
                )}
                <button
                  onClick={() => window.print()}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Property Form Modal */}
      {showEditForm && property && (
        <EditPropertyForm
          property={{
            id: property.id,
            mlsId: property.mlsId,
            address: property.address,
            city: property.city,
            province: property.province,
            postalCode: property.postalCode,
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            propertyType: property.propertyType,
            description: property.description,
            squareFootage: property.squareFootage,
            yearBuilt: property.yearBuilt,
            lotSize: property.lotSize,
            latitude: property.latitude ?? undefined,
            longitude: property.longitude ?? undefined,
            features: getFeatures()
          }}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </div>
  )
}

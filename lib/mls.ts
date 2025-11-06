// MLS Data Service
// Handles fetching and processing MLS listings from various sources

import { proximityService } from './proximity'

export interface MLSProperty {
  id?: string
  mlsId: string
  mlsNumber?: string
  listingAgent?: string
  listingOffice?: string
  address: string
  city: string
  province: string
  postalCode: string
  neighborhood?: string
  price: number
  pricePerSqft?: number
  originalPrice?: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  squareFootage?: number
  lotSize?: number
  yearBuilt?: number
  features: string[]
  amenities: string[]
  parking?: string
  heating?: string
  cooling?: string
  description?: string
  images: string[]
  virtualTour?: string
  status: 'active' | 'sold' | 'pending' | 'withdrawn'
  listDate?: Date
  soldDate?: Date
  daysOnMarket?: number
  latitude?: number
  longitude?: number
  matchPercentage?: number
  proximityScore?: number
  proximityBreakdown?: {
    schoolScore: number
    shoppingScore: number
    hospitalScore: number
    parkScore: number
    transitScore: number
  }
  proximityData?: unknown
}

export interface MLSFilters extends Record<string, unknown> {
  city?: string
  province?: string
  minPrice?: number
  maxPrice?: number
  minBedrooms?: number
  maxBedrooms?: number
  propertyType?: string
  status?: string
  neighborhood?: string
}

export class MLSService {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl
  }

  // Fetch properties from MLS API
  async fetchProperties(filters: MLSFilters = {}): Promise<MLSProperty[]> {
    try {
      // Use Repliers-specific method if base URL contains repliers.io
      if (this.baseUrl.includes('repliers.io')) {
        return this.fetchRepliersProperties(filters)
      }

      // Generic MLS API implementation for other providers
      const params = new URLSearchParams()
      
      if (filters.city) params.append('city', filters.city)
      if (filters.province) params.append('province', filters.province)
      if (filters.minPrice) params.append('minPrice', filters.minPrice.toString())
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString())
      if (filters.minBedrooms) params.append('minBedrooms', filters.minBedrooms.toString())
      if (filters.maxBedrooms) params.append('maxBedrooms', filters.maxBedrooms.toString())
      if (filters.propertyType) params.append('propertyType', filters.propertyType)
      if (filters.status) params.append('status', filters.status)
      if (filters.neighborhood) params.append('neighborhood', filters.neighborhood)

      const response = await fetch(`${this.baseUrl}/properties?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`MLS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as { properties?: unknown[] }
      return this.transformProperties(data.properties || [])
    } catch (error) {
      console.error('Error fetching MLS properties:', error)
      throw error
    }
  }

  // Repliers-specific property fetching
  async fetchRepliersProperties(filters: Record<string, unknown> = {}): Promise<MLSProperty[]> {
    try {
      // Start with basic endpoint - no filters first
      let url = `${this.baseUrl}/listings`
      const params = new URLSearchParams()
      
      // For Repliers test data, fetch ALL properties without any filters
      // Test database doesn't support filtering reliably
      params.append('limit', '100') // Get more properties to work with
      
      // Don't add any filters - fetch all properties and filter client-side
      console.log('🔍 Repliers test data: Fetching ALL properties without filters')
      
      // Build the URL
      if (params.toString()) {
        url += `?${params.toString()}`
      }

      console.log(`🔍 Repliers API Request: ${url}`)

      // Use the correct Repliers authentication method
      const response = await fetch(url, {
        headers: {
          'REPLIERS-API-KEY': this.apiKey, // Correct header name from documentation
          'Content-Type': 'application/json'
        }
      })

      console.log(`📡 Repliers API Response: ${response.status} ${response.statusText}`)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { message?: string }
        console.error('Repliers API Error Details:', errorData)
        throw new Error(`Repliers API error: ${response.status} - ${response.statusText}. ${errorData.message || ''}`)
      }

      const data = await response.json() as { listings?: unknown[] }
      console.log('📋 Repliers API Response Data:', JSON.stringify(data, null, 2))
      
      // Repliers returns listings in the response
      const properties = data.listings || []
      
      if (!Array.isArray(properties)) {
        console.warn('Unexpected Repliers API response format:', data)
        return []
      }

      console.log(`✅ Repliers API: Found ${properties.length} properties`)
      
      // Transform the properties
      let transformedProperties = this.transformRepliersProperties(properties)
      console.log(`🏠 Transformed ${transformedProperties.length} properties`)
      
      // Apply client-side filtering as fallback for unsupported API filters
      transformedProperties = this.applyClientSideFilters(transformedProperties, filters)
      console.log(`🔍 After client-side filtering: ${transformedProperties.length} properties`)
      
      return transformedProperties
    } catch (error) {
      console.error('Error fetching Repliers properties:', error)
      return []
    }
  }

  // Search properties by criteria
  async searchProperties(criteria: {
    location?: string
    priceRange?: { min: number; max: number }
    bedrooms?: number
    bathrooms?: number
    propertyType?: string
    features?: string[]
  }): Promise<MLSProperty[]> {
    const filters: MLSFilters = {}

    if (criteria.location) {
      // For Repliers test data, city filtering doesn't work reliably
      // We'll filter by location after fetching properties
      console.log(`📍 Location specified: ${criteria.location} (will filter after fetch)`)
      // Don't set city filter for Repliers test data
      // filters.city = criteria.location
    }

    // For Repliers test data, most filters don't work reliably
    // We'll fetch all properties and filter client-side
    console.log('🔍 Repliers test data: Fetching all properties, will filter client-side')
    
    // Don't set any filters for Repliers test data
    // if (criteria.priceRange) {
    //   filters.minPrice = criteria.priceRange.min
    //   filters.maxPrice = criteria.priceRange.max
    // }
    // if (criteria.bedrooms) {
    //   filters.minBedrooms = criteria.bedrooms
    // }
    // if (criteria.propertyType) {
    //   filters.propertyType = criteria.propertyType
    // }

    // Fetch properties without city filter (for Repliers test data)
    const allProperties = await this.fetchProperties(filters)
    
    // Apply comprehensive client-side filtering
    let filteredProperties = allProperties
    
    // Location filtering
    if (criteria.location) {
      const locationFilter = criteria.location.toLowerCase()
      filteredProperties = filteredProperties.filter(property => {
        const city = property.city?.toLowerCase() || ''
        const neighborhood = property.neighborhood?.toLowerCase() || ''
        const address = property.address?.toLowerCase() || ''
        
        return city.includes(locationFilter) || 
               neighborhood.includes(locationFilter) || 
               address.includes(locationFilter)
      })
      console.log(`📍 Location filtering: ${allProperties.length} → ${filteredProperties.length} properties`)
    }
    
    // Price filtering
    if (criteria.priceRange) {
      const beforePrice = filteredProperties.length
      filteredProperties = filteredProperties.filter(property => {
        const price = property.price || 0
        if (criteria.priceRange?.min && price < criteria.priceRange.min) return false
        if (criteria.priceRange?.max && price > criteria.priceRange.max) return false
        return true
      })
      console.log(`💰 Price filtering: ${beforePrice} → ${filteredProperties.length} properties`)
    }
    
    // Property type filtering (very flexible matching)
    if (criteria.propertyType) {
      const beforeType = filteredProperties.length
      const targetType = criteria.propertyType.toLowerCase()
      
      // Debug: Show what property types we have
      const uniqueTypes = Array.from(new Set(filteredProperties.map(p => p.propertyType).filter(Boolean)))
      console.log(`🔍 Available property types: ${uniqueTypes.join(', ')}`)
      console.log(`🎯 Looking for: ${targetType}`)
      
      // For Repliers test data, be very permissive with property type matching
      if (targetType === 'house') {
        // Accept almost any residential property type
        filteredProperties = filteredProperties.filter(property => {
          const type = property.propertyType?.toLowerCase() || ''
          const description = property.description?.toLowerCase() || ''
          
          // Very broad matching for residential properties
          const isResidential = 
            type.includes('residential') ||
            type.includes('single') ||
            type.includes('family') ||
            type.includes('detached') ||
            type.includes('house') ||
            type.includes('home') ||
            type.includes('residence') ||
            description.includes('house') ||
            description.includes('home') ||
            description.includes('residential') ||
            description.includes('single family')
          
          return isResidential
        })
      } else {
        // For other property types, use flexible matching
        filteredProperties = filteredProperties.filter(property => {
          const type = property.propertyType?.toLowerCase() || ''
          const description = property.description?.toLowerCase() || ''
          
          return type.includes(targetType) || description.includes(targetType)
        })
      }
      
      console.log(`🏠 Property type filtering: ${beforeType} → ${filteredProperties.length} properties`)
    }
    
    // Bedroom filtering
    if (criteria.bedrooms) {
      const beforeBedrooms = filteredProperties.length
      filteredProperties = filteredProperties.filter(property => {
        const bedrooms = property.bedrooms || 0
        return bedrooms >= (criteria.bedrooms || 0)
      })
      console.log(`🛏️ Bedroom filtering: ${beforeBedrooms} → ${filteredProperties.length} properties`)
    }
    
    // Bathroom filtering
    if (criteria.bathrooms) {
      const beforeBathrooms = filteredProperties.length
      filteredProperties = filteredProperties.filter(property => {
        const bathrooms = property.bathrooms || 0
        return bathrooms >= (criteria.bathrooms || 0)
      })
      console.log(`🚿 Bathroom filtering: ${beforeBathrooms} → ${filteredProperties.length} properties`)
    }
    
    console.log(`✅ Final client-side filtering result: ${filteredProperties.length} properties`)
    return filteredProperties
  }

  // Get property details by MLS ID
  async getPropertyById(mlsId: string): Promise<MLSProperty | null> {
    try {
      const response = await fetch(`${this.baseUrl}/properties/${mlsId}`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 404) return null
        throw new Error(`MLS API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as Record<string, unknown>
      return this.transformProperty(data)
    } catch (error) {
      console.error('Error fetching property:', error)
      return null
    }
  }

  // Transform API response to our format
  private transformProperties(properties: unknown[]): MLSProperty[] {
    return properties.map(prop => this.transformProperty(prop))
  }

  private transformProperty(prop: unknown): MLSProperty {
    const p = prop as Record<string, unknown>
    return {
      mlsId: (p.mlsId as string) || (p.id as string),
      mlsNumber: (p.mlsNumber as string) || (p.mls_number as string),
      listingAgent: (p.listingAgent as string) || (p.listing_agent as string),
      listingOffice: (p.listingOffice as string) || (p.listing_office as string),
      address: p.address as string,
      city: p.city as string,
      province: (p.province as string) || (p.state as string),
      postalCode: (p.postalCode as string) || (p.postal_code as string) || (p.zip as string),
      neighborhood: p.neighborhood as string,
      price: parseInt(p.price as string) || 0,
      pricePerSqft: (p.pricePerSqft as number) || (p.price_per_sqft as number),
      originalPrice: (p.originalPrice as number) || (p.original_price as number),
      bedrooms: parseInt(p.bedrooms as string) || 0,
      bathrooms: parseFloat(p.bathrooms as string) || 0,
      propertyType: (p.propertyType as string) || (p.property_type as string) || 'house',
      squareFootage: (p.squareFootage as number) || (p.square_footage as number),
      lotSize: (p.lotSize as number) || (p.lot_size as number),
      yearBuilt: (p.yearBuilt as number) || (p.year_built as number),
      features: Array.isArray(p.features) ? p.features as string[] : [],
      amenities: Array.isArray(p.amenities) ? p.amenities as string[] : [],
      parking: p.parking as string,
      heating: p.heating as string,
      cooling: p.cooling as string,
      description: p.description as string,
      images: Array.isArray(p.images) ? p.images as string[] : [],
      virtualTour: (p.virtualTour as string) || (p.virtual_tour as string),
      status: ((p.status as string) || 'active') as 'active' | 'sold' | 'pending' | 'withdrawn',
      listDate: p.listDate ? new Date(p.listDate as string) : undefined,
      soldDate: p.soldDate ? new Date(p.soldDate as string) : undefined,
      daysOnMarket: (p.daysOnMarket as number) || (p.days_on_market as number),
      latitude: p.latitude as number,
      longitude: p.longitude as number
    }
  }

  // Repliers-specific property transformation
  private transformRepliersProperties(properties: unknown[]): MLSProperty[] {
    return properties.map(prop => this.transformRepliersProperty(prop))
  }

  // Apply client-side filtering for unsupported API filters
  private applyClientSideFilters(properties: MLSProperty[], filters: Record<string, unknown>): MLSProperty[] {
    return properties.filter(property => {
      // Price range filtering
      if (filters.minPrice && property.price < (filters.minPrice as number)) return false
      if (filters.maxPrice && property.price > (filters.maxPrice as number)) return false
      
      // Bedroom filtering
      if (filters.bedrooms && property.bedrooms < (filters.bedrooms as number)) return false
      
      // Bathroom filtering (allow some flexibility)
      if (filters.bathrooms && property.bathrooms < (filters.bathrooms as number)) return false
      
      // Property type filtering
      if (filters.propertyType && property.propertyType !== (filters.propertyType as string)) return false
      
      return true
    })
  }

  // Process image URLs to handle relative paths
  private processImages(images: string[]): string[] {
    // Only log if there are images to process
    if (images.length > 0) {
      console.log(`🖼️ Processing ${images.length} images`)
    }
    
    const processedImages = images.map(image => {
      // If it's already a full URL, return as is
      if (image.startsWith('http://') || image.startsWith('https://')) {
        return image
      }
      
      // For Repliers test data, use placeholder images
      if (image.startsWith('sample/')) {
        return `https://via.placeholder.com/400x300/cccccc/666666?text=Property+Image`
      }
      
      // For other relative paths, assume they're from the API base
      return `${this.baseUrl}/${image}`
    })
    
    return processedImages
  }

  private transformRepliersProperty(prop: unknown): MLSProperty {
    const p = prop as Record<string, unknown>
    const agents = Array.isArray(p.agents) ? p.agents as Array<Record<string, unknown>> : []
    const office = p.office as Record<string, unknown> | undefined
    const address = p.address as Record<string, unknown> | undefined
    const details = p.details as Record<string, unknown> | undefined
    const lot = p.lot as Record<string, unknown> | undefined
    const nearby = p.nearby as Record<string, unknown> | undefined
    const map = p.map as Record<string, unknown> | undefined
    
    return {
      mlsId: (p.mlsNumber as string) || (p.resource as string) || (p.id as string),
      mlsNumber: p.mlsNumber as string,
      listingAgent: (agents[0] as Record<string, unknown> | undefined)?.name as string || '',
      listingOffice: office?.brokerageName as string || '',
      address: address ? 
        `${address.streetNumber as string} ${address.streetName as string} ${address.streetSuffix as string}`.trim() : 
        '',
      city: address?.city as string || '',
      province: address?.state as string || '',
      postalCode: address?.zip as string || '',
      neighborhood: address?.neighborhood as string || '',
      price: (p.listPrice as number) || 0,
      pricePerSqft: details?.sqft ? Math.round(((p.listPrice as number) || 0) / parseInt(details.sqft as string)) : undefined,
      originalPrice: p.originalPrice as number,
      bedrooms: (details?.numBedrooms as number) || (p.bedrooms as number) || 0,
      bathrooms: (details?.numBathrooms as number) || (p.bathrooms as number) || 0,
      propertyType: (details?.propertyType as string)?.toLowerCase() || (p.propertyType as string)?.toLowerCase() || 'house',
      squareFootage: details?.sqft ? parseInt(details.sqft as string) : undefined,
      lotSize: lot?.acres as number | undefined,
      yearBuilt: details?.yearBuilt ? parseInt(details.yearBuilt as string) : undefined,
      features: this.extractFeatures(prop),
      amenities: (nearby?.amenities as string[]) || [],
      parking: details?.numGarageSpaces ? `${details.numGarageSpaces} garage spaces` : undefined,
      heating: details?.heating as string | undefined,
      cooling: details?.airConditioning as string | undefined,
      description: details?.description as string || '',
      images: this.processImages((p.images as string[]) || []),
      virtualTour: details?.virtualTourUrl as string | undefined,
      status: ((p.status as string) === 'A' ? 'active' : (p.status as string)?.toLowerCase() || 'active') as 'active' | 'sold' | 'pending' | 'withdrawn',
      listDate: p.listDate ? new Date(p.listDate as string) : undefined,
      soldDate: p.soldDate ? new Date(p.soldDate as string) : undefined,
      daysOnMarket: p.daysOnMarket as number,
      latitude: map?.latitude as number | undefined,
      longitude: map?.longitude as number | undefined
    }
  }

  private extractFeatures(prop: unknown): string[] {
    const features = []
    const p = prop as Record<string, unknown>
    const details = p.details as Record<string, unknown>
    
    // Extract features from various property details
    if (details?.extras) {
      features.push(...(details.extras as string).split(',').map((f: string) => f.trim()))
    }
    
    if (details?.patio) {
      features.push(`Patio: ${details.patio as string}`)
    }
    
    if (details?.fireplace) {
      features.push('Fireplace')
    }
    
    if (details?.swimmingPool) {
      features.push('Swimming Pool')
    }
    
    if (details?.garage) {
      features.push('Garage')
    }
    
    return features.filter(Boolean)
  }

  // Calculate proximity data for properties and enhance matching
  async enhanceWithProximityData(
    properties: MLSProperty[], 
    sessionId: string
  ): Promise<MLSProperty[]> {
    try {
      // Get proximity preferences for the session
      const preferences = await proximityService.getProximityPreferences(sessionId)
      
      if (!preferences) {
        console.log('No proximity preferences found for session')
        return properties
      }

      // Get property IDs from the properties
      const propertyIds = properties.map(p => p.id).filter((id): id is string => Boolean(id)) as string[]
      
      if (propertyIds.length === 0) {
        return properties
      }

      // Calculate proximity scores
      const proximityScores = await proximityService.calculateProximityScores(propertyIds, preferences)
      
      // Create a map of property ID to proximity score
      const scoreMap = new Map(proximityScores.map(score => [score.propertyId, score]))

      // Enhance properties with proximity data
      return properties.map(property => {
        const proximityScore = property.id ? scoreMap.get(property.id) : undefined
        
        if (proximityScore) {
          // Combine match percentage with proximity score
          const combinedScore = ((property.matchPercentage || 0) + proximityScore.totalScore) / 2
          
          return {
            ...property,
            matchPercentage: Math.round(Math.min(100, combinedScore)),
            proximityScore: proximityScore.totalScore,
            proximityBreakdown: proximityScore.breakdown,
            proximityData: proximityScore.proximityData
          }
        }

        return property
      }).sort((a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0))
    } catch (error) {
      console.error('Error enhancing properties with proximity data:', error)
      return properties
    }
  }
}

// Factory function to create MLS service instances
export function createMLSService(provider: 'realtor_ca' | 'bridge' | 'simply_rets' | 'repliers' | 'custom') {
  const config = {
    realtor_ca: {
      apiKey: process.env.REALTOR_CA_API_KEY,
      baseUrl: process.env.REALTOR_CA_BASE_URL || 'https://api.realtor.ca'
    },
    bridge: {
      apiKey: process.env.BRIDGE_API_KEY,
      baseUrl: process.env.BRIDGE_BASE_URL || 'https://api.bridge.retrievr.com'
    },
    simply_rets: {
      apiKey: process.env.SIMPLY_RETS_API_KEY,
      baseUrl: process.env.SIMPLY_RETS_BASE_URL || 'https://api.simplyrets.com'
    },
    repliers: {
      apiKey: process.env.REPLIERS_API_KEY,
      baseUrl: process.env.REPLIERS_BASE_URL || 'https://api.repliers.io'
    },
    custom: {
      apiKey: process.env.CUSTOM_MLS_API_KEY,
      baseUrl: process.env.CUSTOM_MLS_BASE_URL || 'https://api.custom-mls.com'
    }
  }

  const serviceConfig = config[provider]
  if (!serviceConfig.apiKey) {
    throw new Error(`API key not configured for ${provider}`)
  }

  return new MLSService(serviceConfig.apiKey, serviceConfig.baseUrl)
}

// Default MLS service (can be configured via environment)
export const mlsService = createMLSService(
  (process.env.MLS_PROVIDER as 'realtor_ca' | 'bridge' | 'simply_rets' | 'repliers' | 'custom' | undefined) || 'repliers'
)

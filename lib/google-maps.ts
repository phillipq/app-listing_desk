// Google Maps API service for distance calculations
// Handles proximity calculations to schools, shopping, etc.

export interface Location {
  latitude: number
  longitude: number
  address?: string
}

export interface Amenity {
  name: string
  type: string
  category: string
  location: Location
}

export interface DistanceResult {
  distanceKm: number
  driveTimeMinutes: number
  walkTimeMinutes?: number
}

export interface ProximityData {
  amenityType: string
  amenityName: string
  category: string
  distanceKm: number
  driveTimeMinutes: number
  walkTimeMinutes?: number
  amenityLatitude: number
  amenityLongitude: number
  amenityAddress: string
}

export class GoogleMapsService {
  private apiKey: string
  private baseUrl: string = 'https://maps.googleapis.com/maps/api'

  constructor(apiKey: string) {
    this.apiKey = apiKey
  }

  // Calculate distance and time between two points
  async calculateDistance(
    origin: Location,
    destination: Location,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<DistanceResult> {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`
      const destinationStr = `${destination.latitude},${destination.longitude}`
      
      const response = await fetch(
        `${this.baseUrl}/distancematrix/json?origins=${originStr}&destinations=${destinationStr}&mode=${mode}&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Google Maps API error: ${response.status}`)
      }

      const data = await response.json() as { 
        status: string
        rows?: Array<{ 
          elements?: Array<{ 
            status: string
            distance?: { value: number }
            duration?: { value: number }
          }>
        }>
      }

      if (data.status !== 'OK' || !data.rows?.[0]?.elements?.[0]) {
        throw new Error(`Distance calculation failed: ${data.status}`)
      }

      const element = data.rows[0].elements[0]
      
      if (element.status !== 'OK') {
        throw new Error(`Route calculation failed: ${element.status}`)
      }

      return {
        distanceKm: (element.distance?.value || 0) / 1000, // Convert meters to kilometers
        driveTimeMinutes: (element.duration?.value || 0) / 60, // Convert seconds to minutes
        walkTimeMinutes: mode === 'walking' ? (element.duration?.value || 0) / 60 : undefined
      }
    } catch (error) {
      console.error('Distance calculation error:', error)
      throw error
    }
  }

  // Find nearby amenities using Google Places API
  async findNearbyAmenities(
    location: Location,
    amenityType: string,
    radius: number = 5000 // 5km radius
  ): Promise<Amenity[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/place/nearbysearch/json?location=${location.latitude},${location.longitude}&radius=${radius}&type=${amenityType}&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json() as { 
        status: string
        results?: Array<{
          name: string
          vicinity: string
          rating?: number
          place_id: string
          geometry: { location: { lat: number; lng: number } }
        }>
      }

      if (data.status !== 'OK') {
        throw new Error(`Places search failed: ${data.status}`)
      }

      return (data.results || []).map((place) => ({
        name: place.name,
        type: amenityType,
        category: this.categorizeAmenity(amenityType, place),
        location: {
          latitude: place.geometry.location.lat,
          longitude: place.geometry.location.lng,
          address: place.vicinity
        }
      }))
    } catch (error) {
      console.error('Places search error:', error)
      throw error
    }
  }

  // Calculate proximity data for a property
  async calculatePropertyProximity(
    propertyLocation: Location,
    amenityTypes: string[] = ['school', 'shopping_mall', 'hospital', 'park', 'transit_station']
  ): Promise<ProximityData[]> {
    const proximityData: ProximityData[] = []

    for (const amenityType of amenityTypes) {
      try {
        // Find nearby amenities
        const amenities = await this.findNearbyAmenities(propertyLocation, amenityType)
        
        // Calculate distances for each amenity
        for (const amenity of amenities) {
          const distance = await this.calculateDistance(propertyLocation, amenity.location)
          
          proximityData.push({
            amenityType,
            amenityName: amenity.name,
            category: amenity.category,
            distanceKm: distance.distanceKm,
            driveTimeMinutes: distance.driveTimeMinutes,
            walkTimeMinutes: distance.walkTimeMinutes,
            amenityLatitude: amenity.location.latitude,
            amenityLongitude: amenity.location.longitude,
            amenityAddress: amenity.location.address || ''
          })
        }
      } catch (error) {
        console.error(`Error calculating proximity for ${amenityType}:`, error)
        // Continue with other amenity types even if one fails
      }
    }

    return proximityData
  }

  // Categorize amenities for better organization
  private categorizeAmenity(type: string, place: Record<string, unknown>): string {
    switch (type) {
      case 'school':
        // Try to determine school level from name or types
        const name = typeof place.name === 'string' ? place.name.toLowerCase() : ''
        if (name.includes('elementary') || name.includes('primary')) return 'elementary'
        if (name.includes('high') || name.includes('secondary')) return 'high_school'
        if (name.includes('middle') || name.includes('junior')) return 'middle_school'
        return 'school'
      
      case 'shopping_mall':
        return 'mall'
      
      case 'hospital':
        return 'hospital'
      
      case 'park':
        return 'park'
      
      case 'transit_station':
        return 'transit'
      
      default:
        return type
    }
  }

  // Get geocoding for an address
  async geocodeAddress(address: string): Promise<Location | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`
      )

      if (!response.ok) {
        throw new Error(`Geocoding API error: ${response.status}`)
      }

      const data = await response.json() as { 
        status: string
        results?: Array<{ 
          geometry: { location: { lat: number; lng: number } }
          formatted_address: string
        }>
      }

      if (data.status !== 'OK' || !data.results?.[0]) {
        return null
      }

      const result = data.results[0]
      return {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address
      }
    } catch (error) {
      console.error('Geocoding error:', error)
      return null
    }
  }
}

// Factory function to create Google Maps service
export function createGoogleMapsService(): GoogleMapsService {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  
  if (!apiKey) {
    throw new Error('Google Maps API key not configured')
  }

  return new GoogleMapsService(apiKey)
}

// Default service instance
export const googleMapsService = createGoogleMapsService()

interface GoogleMapsConfig {
  apiKey: string
  baseUrl: string
}

interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  types: string[]
  vicinity?: string
  business_status?: string
}

interface DistanceMatrixResult {
  destination_addresses: string[]
  origin_addresses: string[]
  rows: Array<{
    elements: Array<{
      distance?: {
        text: string
        value: number
      }
      duration?: {
        text: string
        value: number
      }
      status: string
    }>
  }>
}

interface NearbySearchResult {
  results: PlaceResult[]
  status: string
  next_page_token?: string
}

export class GoogleMapsService {
  private config: GoogleMapsConfig

  constructor() {
    this.config = {
      apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
      baseUrl: 'https://maps.googleapis.com/maps/api'
    }
  }

  /**
   * Search for nearby places using Google Places API
   */
  async searchNearbyPlaces(
    location: { lat: number; lng: number },
    radius: number = 5000, // 5km default
    types: string[] = ['school', 'hospital', 'park', 'shopping_mall', 'restaurant', 'bank', 'gas_station'],
    keyword?: string
  ): Promise<PlaceResult[]> {
    try {
      // Check if API key is configured
      if (!this.config.apiKey) {
        console.warn('Google Maps API key not configured. Returning empty results.')
        return []
      }

      const { lat, lng } = location
      const locationStr = `${lat},${lng}`
      
      const params = new URLSearchParams({
        location: locationStr,
        radius: radius.toString(),
        type: types.join('|'),
        key: this.config.apiKey
      })

      if (keyword) {
        params.append('keyword', keyword)
      }

      const response = await fetch(
        `${this.config.baseUrl}/place/nearbysearch/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json() as NearbySearchResult

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        console.error(`Google Places API error: ${data.status}`)
        if (data.status === 'REQUEST_DENIED') {
          console.error('Google Places API access denied. Please check:')
          console.error('1. API key is correct')
          console.error('2. Places API is enabled in Google Cloud Console')
          console.error('3. API key has proper restrictions')
          return []
        }
        throw new Error(`Google Places API error: ${data.status}`)
      }

      return data.results || []
    } catch (error) {
      console.error('Error searching nearby places:', error)
      // Return empty array instead of throwing to prevent breaking the app
      return []
    }
  }

  /**
   * Get detailed information about a place using place_id
   */
  async getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
    try {
      const params = new URLSearchParams({
        place_id: placeId,
        fields: 'place_id,name,formatted_address,geometry,rating,types,vicinity,business_status,website,formatted_phone_number',
        key: this.config.apiKey
      })

      const response = await fetch(
        `${this.config.baseUrl}/place/details/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json() as { 
        status: string
        result?: PlaceResult
      }

      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status}`)
      }

      return data.result || null
    } catch (error) {
      console.error('Error getting place details:', error)
      throw error
    }
  }

  /**
   * Calculate travel times between origin and destinations
   */
  async calculateTravelTimes(
    origin: { lat: number; lng: number },
    destinations: Array<{ lat: number; lng: number }>,
    modes: string[] = ['driving', 'transit', 'walking']
  ): Promise<DistanceMatrixResult> {
    try {
      const originStr = `${origin.lat},${origin.lng}`
      const destinationsStr = destinations.map(dest => `${dest.lat},${dest.lng}`).join('|')

      const params = new URLSearchParams({
        origins: originStr,
        destinations: destinationsStr,
        mode: modes[0] || 'driving', // Primary mode
        key: this.config.apiKey
      })

      // Add transit mode if requested
      if (modes.includes('transit')) {
        params.append('transit_mode', 'bus|subway|train')
      }

      const response = await fetch(
        `${this.config.baseUrl}/distancematrix/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`Google Distance Matrix API error: ${response.status}`)
      }

      const data = await response.json() as DistanceMatrixResult

      return data
    } catch (error) {
      console.error('Error calculating travel times:', error)
      throw error
    }
  }

  /**
   * Geocode an address to get coordinates
   */
  async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
      const params = new URLSearchParams({
        address: address,
        key: this.config.apiKey
      })

      const response = await fetch(
        `${this.config.baseUrl}/geocode/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`)
      }

      const data = await response.json() as { 
        status: string
        results?: Array<{ geometry: { location: { lat: number; lng: number } } }>
      }

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null
      }

      const location = data.results[0]?.geometry.location
      if (!location) {
        return null
      }
      return {
        lat: location.lat,
        lng: location.lng
      }
    } catch (error) {
      console.error('Error geocoding address:', error)
      throw error
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(coordinates: { lat: number; lng: number }): Promise<string | null> {
    try {
      const params = new URLSearchParams({
        latlng: `${coordinates.lat},${coordinates.lng}`,
        key: this.config.apiKey
      })

      const response = await fetch(
        `${this.config.baseUrl}/geocode/json?${params.toString()}`
      )

      if (!response.ok) {
        throw new Error(`Google Geocoding API error: ${response.status}`)
      }

      const data = await response.json() as { 
        status: string
        results?: Array<{ formatted_address: string }>
      }

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return null
      }

      return data.results[0]?.formatted_address || null
    } catch (error) {
      console.error('Error reverse geocoding coordinates:', error)
      throw error
    }
  }

  /**
   * Search for specific types of amenities near a property
   */
  async findAmenitiesByCategory(
    propertyLocation: { lat: number; lng: number },
    categories: Record<string, { radius: number; limit?: number }>
  ): Promise<Record<string, PlaceResult[]>> {
    const results: Record<string, PlaceResult[]> = {}

    // Define category mappings to Google Places API types
    const categoryMappings: Record<string, { types: string[]; keyword: string }> = {
      // Essential Services
      grocery: { types: ['grocery_or_supermarket', 'supermarket'], keyword: 'grocery' },
      pharmacy: { types: ['pharmacy', 'drugstore'], keyword: 'pharmacy' },
      hospital: { types: ['hospital', 'health', 'doctor', 'clinic', 'medical_center', 'urgent_care'], keyword: 'medical' },
      bank: { types: ['bank', 'atm'], keyword: 'bank' },
      
      // Education
      elementary: { types: ['school', 'elementary_school'], keyword: 'elementary school' },
      middle_school: { types: ['school', 'middle_school', 'junior_high_school'], keyword: 'middle school' },
      high_school: { types: ['school', 'secondary_school'], keyword: 'high school' },
      university: { types: ['university', 'college'], keyword: 'university' },
      library: { types: ['library'], keyword: 'library' },
      
      // Recreation & Lifestyle
      gym: { types: ['gym', 'fitness_center'], keyword: 'gym' },
      gyms: { types: ['gym', 'fitness_center'], keyword: 'gym' },
      parks: { types: ['park', 'recreation'], keyword: 'park' },
      shopping: { types: ['shopping_mall', 'store', 'department_store'], keyword: 'shopping' },
      restaurants: { types: ['restaurant', 'food', 'meal_takeaway'], keyword: 'restaurant' },
      transit: { types: ['transit_station', 'bus_station', 'subway_station'], keyword: 'transit' },
      transit_stations: { types: ['transit_station', 'bus_station', 'subway_station'], keyword: 'transit' },
      nightlife: { types: ['bar', 'night_club', 'lounge'], keyword: 'nightlife' },
      
      // Legacy categories for backward compatibility
      schools: { types: ['school', 'university'], keyword: 'school' },
      hospitals: { types: ['hospital', 'health', 'doctor', 'clinic', 'medical_center', 'urgent_care'], keyword: 'medical' },
      dining: { types: ['restaurant', 'food', 'meal_takeaway'], keyword: 'restaurant' },
      services: { types: ['bank', 'atm', 'gas_station', 'car_repair', 'car_wash', 'laundry', 'dry_cleaning'], keyword: 'service' },
      daycare: { types: ['daycare', 'child_care'], keyword: 'daycare' },
      healthcare: { types: ['hospital', 'health', 'doctor', 'clinic', 'medical_center', 'pharmacy'], keyword: 'healthcare' }
    }

    try {
      // Dynamically search for each category
      for (const [category, config] of Object.entries(categories)) {
        const mapping = categoryMappings[category]
        if (mapping) {
          const places = await this.searchNearbyPlaces(
            propertyLocation,
            config.radius,
            mapping.types,
            mapping.keyword
          )
          results[category] = places.slice(0, config.limit || 10)
        } else {
          console.warn(`Unknown category: ${category}`)
          results[category] = []
        }
      }

      return results
    } catch (error) {
      console.error('Error finding amenities by category:', error)
      throw error
    }
  }
}

export default GoogleMapsService

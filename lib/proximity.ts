// Proximity service for calculating and storing property proximity data
import { googleMapsService, ProximityData } from './google-maps'
import { prisma } from './prisma'

export interface ProximityPreference {
  schoolWeight: number
  shoppingWeight: number
  hospitalWeight: number
  parkWeight: number
  transitWeight: number
  preferredSchools: string[]
  preferredShopping: string[]
  maxDriveTimeMinutes?: number
  walkablePreferred: boolean
}

export interface ProximityScore {
  propertyId: string
  totalScore: number
  breakdown: {
    schoolScore: number
    shoppingScore: number
    hospitalScore: number
    parkScore: number
    transitScore: number
  }
  proximityData: ProximityData[]
}

export class ProximityService {
  // Calculate and store proximity data for a property
  // Note: This functionality should use DistanceProfile/Amenity models instead
  async calculatePropertyProximity(propertyId: string): Promise<void> {
    try {
      // Get property details
      const property = await prisma.property.findUnique({
        where: { id: propertyId }
      })

      if (!property || !property.latitude || !property.longitude) {
        throw new Error('Property not found or missing coordinates')
      }

      // Calculate proximity data using Google Maps
      const proximityData = await googleMapsService.calculatePropertyProximity({
        latitude: property.latitude,
        longitude: property.longitude
      })

      // TODO: Store proximity data using DistanceProfile/Amenity/TravelTime models
      // The PropertyProximity model doesn't exist in the schema
      // This should be refactored to use the existing DistanceProfile system

      console.log(`Calculated proximity for property ${propertyId}: ${proximityData.length} amenities`)
      console.warn('Proximity data not persisted - PropertyProximity model does not exist in schema')
    } catch (error) {
      console.error('Error calculating property proximity:', error)
      throw error
    }
  }

  // Calculate proximity scores for properties based on user preferences
  // Note: This should use DistanceProfile/Amenity/TravelTime models from the schema
  async calculateProximityScores(
    propertyIds: string[],
    preferences: ProximityPreference
  ): Promise<ProximityScore[]> {
    const scores: ProximityScore[] = []

    for (const propertyId of propertyIds) {
      try {
        // Get property
        const property = await prisma.property.findUnique({
          where: { id: propertyId }
        })

        if (!property) continue

        // TODO: Get proximity data from TravelTime/Amenity models
        // For now, return empty scores since PropertyProximity model doesn't exist
        const emptyProximities: Array<{
          amenityType: string
          amenityName: string
          category: string
          distanceKm: number
          driveTimeMinutes: number
          walkTimeMinutes: number
          amenityLatitude: number
          amenityLongitude: number
          amenityAddress: string
        }> = []

        const schoolScore = this.calculateAmenityScore(
          emptyProximities.filter(p => p.amenityType === 'school'),
          preferences.schoolWeight,
          preferences.preferredSchools,
          preferences.maxDriveTimeMinutes
        )

        const shoppingScore = this.calculateAmenityScore(
          emptyProximities.filter(p => p.amenityType === 'shopping_mall'),
          preferences.shoppingWeight,
          preferences.preferredShopping,
          preferences.maxDriveTimeMinutes
        )

        const hospitalScore = this.calculateAmenityScore(
          emptyProximities.filter(p => p.amenityType === 'hospital'),
          preferences.hospitalWeight,
          [],
          preferences.maxDriveTimeMinutes
        )

        const parkScore = this.calculateAmenityScore(
          emptyProximities.filter(p => p.amenityType === 'park'),
          preferences.parkWeight,
          [],
          preferences.maxDriveTimeMinutes
        )

        const transitScore = this.calculateAmenityScore(
          emptyProximities.filter(p => p.amenityType === 'transit_station'),
          preferences.transitWeight,
          [],
          preferences.maxDriveTimeMinutes
        )

        const totalScore = schoolScore + shoppingScore + hospitalScore + parkScore + transitScore

        scores.push({
          propertyId,
          totalScore,
          breakdown: {
            schoolScore,
            shoppingScore,
            hospitalScore,
            parkScore,
            transitScore
          },
          proximityData: emptyProximities.map(p => ({
            amenityType: p.amenityType,
            amenityName: p.amenityName,
            category: p.category,
            distanceKm: p.distanceKm,
            driveTimeMinutes: p.driveTimeMinutes,
            walkTimeMinutes: p.walkTimeMinutes,
            amenityLatitude: p.amenityLatitude,
            amenityLongitude: p.amenityLongitude,
            amenityAddress: p.amenityAddress
          }))
        })
      } catch (error) {
        console.error(`Error calculating score for property ${propertyId}:`, error)
      }
    }

    // Sort by total score (highest first)
    return scores.sort((a, b) => b.totalScore - a.totalScore)
  }

  // Calculate score for a specific amenity type
  private calculateAmenityScore(
    proximities: Array<{
      amenityType: string
      amenityName: string
      distanceKm: number
      driveTimeMinutes: number
    }>,
    weight: number,
    preferredNames: string[],
    maxDriveTime?: number
  ): number {
    if (proximities.length === 0) return 0

    let totalScore = 0
    let count = 0

    for (const proximity of proximities) {
      // Check if within max drive time
      if (maxDriveTime && proximity.driveTimeMinutes > maxDriveTime) {
        continue
      }

      // Base score based on distance (closer = higher score)
      let score = Math.max(0, 100 - (proximity.distanceKm * 10)) // 10 points per km

      // Bonus for preferred amenities
      if (preferredNames.length > 0) {
        const isPreferred = preferredNames.some(name => 
          proximity.amenityName.toLowerCase().includes(name.toLowerCase())
        )
        if (isPreferred) {
          score *= 1.5 // 50% bonus for preferred amenities
        }
      }

      // Bonus for very close amenities
      if (proximity.distanceKm < 1) {
        score *= 1.2 // 20% bonus for amenities within 1km
      }

      totalScore += score
      count++
    }

    // Average score weighted by importance
    const averageScore = count > 0 ? totalScore / count : 0
    return (averageScore * weight) / 100
  }

  // Extract proximity preferences from chat conversation
  // Note: Session model doesn't have a messages relation in the schema
  async extractProximityPreferences(sessionId: string): Promise<ProximityPreference> {
    try {
      // Get session
      const session = await prisma.session.findUnique({
        where: { sessionToken: sessionId }
      })

      if (!session) {
        throw new Error('Session not found')
      }

      // TODO: Get conversation messages from CommunicationChannel/Conversation models
      // For now, use empty conversation since Session doesn't have messages relation
      const conversation = ''

      const _prompt = `
Analyze this real estate conversation and extract proximity preferences. Return a JSON object with the following structure:

{
  "schoolWeight": number (0-100, how important schools are),
  "shoppingWeight": number (0-100, how important shopping is),
  "hospitalWeight": number (0-100, how important hospitals are),
  "parkWeight": number (0-100, how important parks are),
  "transitWeight": number (0-100, how important transit is),
  "preferredSchools": ["school name 1", "school name 2"],
  "preferredShopping": ["mall name 1", "mall name 2"],
  "maxDriveTimeMinutes": number (maximum acceptable drive time),
  "walkablePreferred": boolean
}

Conversation:
${conversation}

Extract preferences based on what the user mentioned about:
- Schools (elementary, high school, specific schools)
- Shopping (malls, grocery stores, specific stores)
- Healthcare (hospitals, clinics)
- Recreation (parks, gyms, entertainment)
- Transportation (transit, walkability)
- Distance preferences (walking distance, drive time limits)

Return only the JSON object, no other text.
`

      // This would integrate with OpenAI API to extract preferences
      // For now, return default preferences
      return {
        schoolWeight: 50,
        shoppingWeight: 30,
        hospitalWeight: 20,
        parkWeight: 15,
        transitWeight: 25,
        preferredSchools: [],
        preferredShopping: [],
        maxDriveTimeMinutes: 30,
        walkablePreferred: false
      }
    } catch (error) {
      console.error('Error extracting proximity preferences:', error)
      // Return default preferences on error
      return {
        schoolWeight: 50,
        shoppingWeight: 30,
        hospitalWeight: 20,
        parkWeight: 15,
        transitWeight: 25,
        preferredSchools: [],
        preferredShopping: [],
        maxDriveTimeMinutes: 30,
        walkablePreferred: false
      }
    }
  }

  // Store proximity preferences for a session
  // Note: ProximityPreference model doesn't exist in the schema
  // TODO: Store preferences in a different model or use JSON field
  async storeProximityPreferences(
    _sessionId: string,
    _preferences: ProximityPreference
  ): Promise<void> {
    // TODO: Implement storage using existing models
    // Could store in Session model as JSON or create a new model
    console.warn('ProximityPreference model does not exist - preferences not persisted')
  }

  // Get proximity preferences for a session
  // Note: ProximityPreference model doesn't exist in the schema
  async getProximityPreferences(_sessionId: string): Promise<ProximityPreference | null> {
    // TODO: Retrieve preferences from existing models
    // Return null for now since the model doesn't exist
    return null
  }
}

// Default service instance
export const proximityService = new ProximityService()

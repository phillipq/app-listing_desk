import { GoogleMapsService } from '@/lib/google-maps-service'
import { prisma } from '@/lib/prisma'

export class DistanceProfileService {
  private googleMaps: GoogleMapsService

  constructor() {
    this.googleMaps = new GoogleMapsService()
  }


  /**
   * Generate an auto-generated report name
   */
  private generateReportName(propertyId: string, profileName?: string): string {
    const now = new Date()
    const dateStr = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
    const timeStr = now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
    
    // Validate profileName to avoid "invalid date" issues
    const cleanProfileName = profileName && profileName.trim() && !profileName.includes('invalid') 
      ? profileName.trim() 
      : null
    
    return cleanProfileName ? `${cleanProfileName} - ${dateStr} ${timeStr}` : `Location Insights - ${dateStr} ${timeStr}`
  }

  /**
   * Generate a distance profile for a property or ad-hoc location
   */
  async generateDistanceProfile(
    options: {
      propertyId?: string
      realtorId?: string
      isAdHoc?: boolean
      adHocAddress?: string
      adHocLatitude?: number
      adHocLongitude?: number
      categories?: Record<string, boolean>
      distances?: Record<string, number>
      profileName?: string
    }
  ) {
    try {
      const { propertyId, realtorId, isAdHoc, adHocAddress, adHocLatitude, adHocLongitude, categories, distances, profileName } = options

      let propertyLocation: { lat: number; lng: number }

      // For ad-hoc profiles, use provided coordinates
      if (isAdHoc) {
        if (!adHocLatitude || !adHocLongitude) {
          throw new Error('Ad-hoc coordinates are required')
        }
        propertyLocation = {
          lat: adHocLatitude,
          lng: adHocLongitude
        }
      } else {
        // For property-based profiles, get property details
        if (!propertyId) {
          throw new Error('Property ID is required for property-based profiles')
        }
        const property = await prisma.property.findUnique({
          where: { id: propertyId }
        })

        if (!property || !property.latitude || !property.longitude) {
          throw new Error('Property coordinates are required')
        }

        propertyLocation = {
          lat: property.latitude,
          lng: property.longitude
        }
      }

      // Generate auto-generated report name
      const reportName = this.generateReportName(propertyId || 'adhoc', profileName)

      // Create new distance profile (don't delete existing ones)
      const distanceProfile = await prisma.distanceProfile.create({
        data: {
          propertyId: propertyId || null,
          profileName: reportName,
          categories: {},
          totalAmenities: 0,
          averageTime: 0,
          isActive: true,
          isAdHoc: isAdHoc || false,
          adHocAddress: adHocAddress || null,
          adHocLatitude: adHocLatitude || null,
          adHocLongitude: adHocLongitude || null,
          realtorId: realtorId || null
        }
      })

      // Define default categories if none provided
      const defaultCategories = {
        schools: { radius: 5000, limit: 10 },      // 5km radius, max 10 schools
        hospitals: { radius: 10000, limit: 5 },     // 10km radius, max 5 hospitals
        parks: { radius: 3000, limit: 10 },         // 3km radius, max 10 parks
        shopping: { radius: 5000, limit: 10 },      // 5km radius, max 10 shopping
        dining: { radius: 3000, limit: 10 },        // 3km radius, max 10 dining
        services: { radius: 2000, limit: 10 },      // 2km radius, max 10 services
        gyms: { radius: 3000, limit: 5 },          // 3km radius, max 5 gyms
        transit_stations: { radius: 2000, limit: 5 }, // 2km radius, max 5 transit
        daycare: { radius: 3000, limit: 5 },       // 3km radius, max 5 daycare
        healthcare: { radius: 5000, limit: 5 }      // 5km radius, max 5 healthcare
      }
      
      // Use provided categories and distances if available, otherwise use defaults
      let searchCategories: Record<string, { radius: number; limit: number }> = defaultCategories
      
      if (categories && distances) {
        searchCategories = {}
        for (const [category, isSelected] of Object.entries(categories)) {
          if (isSelected && distances[category]) {
            searchCategories[category] = {
              radius: distances[category] * 1000, // Convert km to meters
              limit: 10 // Default limit
            }
          }
        }
      }
      
      console.log('🔍 Searching for amenities with categories:', Object.keys(searchCategories))
      
      // Find amenities by category
      let amenities = {}
      try {
        amenities = await this.googleMaps.findAmenitiesByCategory(propertyLocation, searchCategories)
        console.log('Found amenities:', amenities)
      } catch (error) {
        console.error('Error finding amenities by category:', error)
        // If Google Maps API fails, create a basic profile with no amenities
        amenities = {}
      }

      // Store amenities in database
      const storedAmenities: Array<{
        id: string;
        name: string;
        address: string | null;
        latitude: number;
        longitude: number;
        rating: number | null;
        category: string;
        travelTimes: Array<{
          drivingTime: number | null;
          walkingTime: number | null;
          transitTime: number | null;
          distance: number | null;
        }>;
      }> = []
      
      // Create a map to track unique places and their categories
      const uniquePlaces = new Map<string, { place: {
        place_id: string;
        name: string;
        formatted_address?: string;
        vicinity?: string;
        rating?: number;
        geometry: {
          location: {
            lat: number;
            lng: number;
          };
        };
      }; categories: string[] }>()
      
      for (const [category, places] of Object.entries(amenities)) {
        const placesArray = places as Array<{
          place_id: string;
          name: string;
          formatted_address?: string;
          vicinity?: string;
          rating?: number;
          geometry: {
            location: {
              lat: number;
              lng: number;
            };
          };
        }>
        console.log(`Processing ${category}: ${placesArray.length} places`)
        for (const place of placesArray) {
          const placeId = place.place_id
          if (uniquePlaces.has(placeId)) {
            // Add category to existing place
            uniquePlaces.get(placeId)!.categories.push(category)
          } else {
            // Create new place entry
            uniquePlaces.set(placeId, {
              place: place,
              categories: [category]
            })
          }
        }
      }

      console.log(`Found ${uniquePlaces.size} unique places`)

      // Store unique places in database
      for (const [placeId, placeData] of Array.from(uniquePlaces.entries())) {
        const { place, categories } = placeData
        // Use the first category as primary
        const primaryCategory = categories[0] || 'unknown'
        const categoryString = primaryCategory
        
        try {

          // Check if amenity already exists by name and location
          const existingAmenity = await prisma.amenity.findFirst({
            where: {
              name: place.name || 'Unknown Place',
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng
            }
          })

          let amenity
          if (existingAmenity) {
            // Update existing amenity
            amenity = await prisma.amenity.update({
              where: { id: existingAmenity.id },
              data: {
                profileId: distanceProfile.id,
                category: categoryString,
                address: place.formatted_address || place.vicinity || 'Address not available',
                rating: place.rating || null,
                isActive: true
              }
            })
          } else {
            // Create new amenity
            amenity = await prisma.amenity.create({
              data: {
                profileId: distanceProfile.id,
                name: place.name || 'Unknown Place',
                category: categoryString,
                address: place.formatted_address || place.vicinity || 'Address not available',
                latitude: place.geometry.location.lat,
                longitude: place.geometry.location.lng,
                rating: place.rating || null,
                isActive: true
              }
            })
          }

          storedAmenities.push({
            id: amenity.id,
            name: amenity.name,
            address: amenity.address,
            latitude: amenity.latitude,
            longitude: amenity.longitude,
            rating: amenity.rating,
            category: amenity.category,
            travelTimes: []
          })
          console.log(`Stored amenity: ${amenity.name} (${categories.join(', ')})`)
        } catch (error: unknown) {
          console.error(`Error creating amenity ${place.name}:`, error)
          // If it's a unique constraint error, try to update the existing record
          if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
            try {
              const existingAmenity = await prisma.amenity.findFirst({
                where: {
                  profileId: distanceProfile.id,
                  placeId: placeId || 'unknown'
                }
              })
              
              if (existingAmenity) {
                await prisma.amenity.update({
                  where: { id: existingAmenity.id },
                  data: {
                    name: place.name || 'Unknown Place',
                    category: categoryString,
                    address: place.formatted_address || place.vicinity || 'Address not available',
                    latitude: place.geometry.location.lat,
                    longitude: place.geometry.location.lng,
                    rating: place.rating || null
                  }
                })
                console.log(`Updated existing amenity: ${place.name}`)
              }
            } catch (updateError) {
              console.error(`Error updating amenity ${place.name}:`, updateError)
            }
          }
          // Continue with other amenities even if one fails
        }
      }

      console.log(`Total amenities stored: ${storedAmenities.length}`)

      // Calculate travel times for each amenity
      // For ad-hoc profiles, we need a property reference point for travel times
      // Use a virtual property ID based on the profile ID
      const referencePropertyId = isAdHoc ? distanceProfile.id : propertyId!
      
      const _travelTimes: Array<{
        amenityId: string;
        drivingTime: number;
        transitTime: number;
        walkingTime: number;
        distance: number;
      }> = []
      
      for (const amenity of storedAmenities) {
        const amenityLocation = {
          lat: amenity.latitude,
          lng: amenity.longitude
        }

        try {
          // Get travel times for different modes
          const travelTimeData = await this.googleMaps.calculateTravelTimes(
            propertyLocation,
            [amenityLocation],
            ['driving', 'transit', 'walking']
          )

          // Store travel times
          if (travelTimeData.rows[0]?.elements[0]) {
            const element = travelTimeData.rows[0].elements[0]
            
            console.log(`🔍 Travel time data for ${amenity.name}:`, element)
            
            if (element.status === 'OK' && element.duration && element.distance) {
              // Calculate walking distance using straight-line distance (more realistic for walking)
              const straightLineDistance = this.calculateStraightLineDistance(
                propertyLocation,
                { lat: amenity.latitude, lng: amenity.longitude }
              )
              
              // Store all travel times in a single record
              await prisma.travelTime.upsert({
                where: {
                  propertyId_amenityId: {
                    propertyId: referencePropertyId,
                    amenityId: amenity.id
                  }
                },
                update: {
                  drivingTime: Math.round(element.duration.value / 60), // Convert seconds to minutes
                  transitTime: Math.round(element.duration.value * 1.5 / 60), // Estimate transit time in minutes
                  walkingTime: Math.round(straightLineDistance * 60 / 5), // 5 km/h walking speed in minutes
                  distance: element.distance.value / 1000 // Convert meters to kilometers
                },
                create: {
                  propertyId: referencePropertyId,
                  amenityId: amenity.id,
                  drivingTime: Math.round(element.duration.value / 60), // Convert seconds to minutes
                  transitTime: Math.round(element.duration.value * 1.5 / 60), // Estimate transit time in minutes
                  walkingTime: Math.round(straightLineDistance * 60 / 5), // 5 km/h walking speed in minutes
                  distance: element.distance.value / 1000 // Convert meters to kilometers
                }
              })
              
              console.log(`✅ Stored travel times for ${amenity.name}`)
            } else {
              console.log(`❌ Failed to get travel times for ${amenity.name}:`, element.status)
            }
          }
        } catch (error) {
          console.error(`Error calculating travel times for amenity ${amenity.name}:`, error)
          // Continue with other amenities even if one fails
        }
      }

      // Return the created profile by ID
      return await this.getDistanceProfileById(distanceProfile.id)

    } catch (error) {
      console.error('Error generating distance profile:', error)
      throw error
    }
  }

  /**
   * Build search categories from custom categories
   */
  private buildSearchCategories(customCategories: string[], defaultCategories: Record<string, { radius: number; limit: number }>) {
    const searchCategories: Record<string, { radius: number; limit: number }> = {}
    
    for (const category of customCategories) {
      if (defaultCategories[category]) {
        searchCategories[category] = defaultCategories[category]
      } else {
        // Use default settings for unknown categories
        searchCategories[category] = { radius: 3000, limit: 5 }
      }
    }
    
    return searchCategories
  }

  /**
   * Get an existing distance profile
   */
  async getDistanceProfile(propertyId: string) {
    try {
      const profile = await prisma.distanceProfile.findFirst({
        where: {
          propertyId: propertyId,
          isActive: true
        },
        include: {
          amenities: {
            include: {
              travelTimes: true
            }
          }
        }
      })

      if (!profile) {
        return null
      }

      // Parse categories from JSON field
      const categories = profile.categories as Record<string, unknown> || {}

      // Group amenities by category
      const amenitiesByCategory: Record<string, Array<{
        id: string;
        name: string;
        address: string | null;
        latitude: number;
        longitude: number;
        rating: number | null;
        travelTimes: Array<{
          drivingTime: number | null;
          walkingTime: number | null;
          transitTime: number | null;
          distance: number | null;
        }>;
      }>> = {}
      for (const amenity of (profile.amenities ?? [])) {
        const categoryKey = amenity.category ?? 'uncategorized'
        if (!amenitiesByCategory[categoryKey]) {
          amenitiesByCategory[categoryKey] = []
        }
        const list = amenitiesByCategory[categoryKey]
        list.push({
          id: amenity.id,
          name: amenity.name,
          address: amenity.address,
          latitude: amenity.latitude,
          longitude: amenity.longitude,
          rating: amenity.rating,
          travelTimes: amenity.travelTimes || []
        })
      }

      return {
        id: profile.id,
        propertyId: profile.propertyId,
        createdAt: profile.createdAt,
        isActive: profile.isActive,
        categories: categories,
        amenities: amenitiesByCategory,
        totalAmenities: profile.totalAmenities,
        averageTime: profile.averageTime,
        summary: {
          totalAmenities: profile.totalAmenities,
          averageTime: profile.averageTime
        }
      }

    } catch (error) {
      console.error('Error fetching distance profile:', error)
      throw error
    }
  }

  /**
   * Get all distance profiles for a property
   */
  async getAllDistanceProfiles(propertyId: string) {
    try {
      const profiles = await prisma.distanceProfile.findMany({
        where: {
          propertyId: propertyId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          profileName: true,
          createdAt: true,
          isActive: true,
          totalAmenities: true,
          averageTime: true,
          categories: true
        }
      })

      return profiles.map(profile => ({
        id: profile.id,
        reportName: profile.profileName,
        generatedAt: profile.createdAt,
        isActive: profile.isActive,
        totalAmenities: profile.totalAmenities,
        averageTime: profile.averageTime,
        categories: profile.categories
      }))
    } catch (error) {
      console.error('Error fetching all distance profiles:', error)
      throw error
    }
  }

  /**
   * Get all ad-hoc distance profiles for a realtor
   */
  async getAdHocProfiles(realtorId: string) {
    try {
      const profiles = await prisma.distanceProfile.findMany({
        where: {
          isAdHoc: true,
          realtorId: realtorId,
          isActive: true
        },
        orderBy: {
          createdAt: 'desc'
        },
        select: {
          id: true,
          profileName: true,
          adHocAddress: true,
          adHocLatitude: true,
          adHocLongitude: true,
          createdAt: true,
          isActive: true,
          totalAmenities: true,
          averageTime: true
        }
      })

      return profiles.map(profile => ({
        id: profile.id,
        reportName: profile.profileName,
        address: profile.adHocAddress ?? 'Unknown location',
        latitude: profile.adHocLatitude ?? null,
        longitude: profile.adHocLongitude ?? null,
        generatedAt: profile.createdAt.toISOString(),
        totalAmenities: profile.totalAmenities,
        averageTime: profile.averageTime
      }))
    } catch (error) {
      console.error('Error fetching ad-hoc distance profiles:', error)
      throw error
    }
  }

  /**
   * Get a specific distance profile by ID
   */
  async getDistanceProfileById(profileId: string) {
    try {
      const profile = await prisma.distanceProfile.findUnique({
        where: {
          id: profileId
        },
        include: {
          amenities: {
            include: {
              travelTimes: true
            }
          }
        }
      })

      if (!profile) {
        return null
      }

      console.log(`🔍 Found profile: ${profile.id} with ${profile.amenities.length} amenities`)

      // Get property location - either from property or ad-hoc coordinates
      let propertyLocation: { lat: number; lng: number } | null = null
      if (profile.isAdHoc && profile.adHocLatitude && profile.adHocLongitude) {
        propertyLocation = {
          lat: profile.adHocLatitude,
          lng: profile.adHocLongitude
        }
      } else if (profile.propertyId) {
        const property = await prisma.property.findUnique({
          where: { id: profile.propertyId },
          select: { latitude: true, longitude: true }
        })
        if (property?.latitude && property?.longitude) {
          propertyLocation = {
            lat: property.latitude,
            lng: property.longitude
          }
        }
      }

      // Parse categories from JSON field
      const categories = profile.categories as Record<string, unknown> || {}

      // Group amenities by category
      const amenitiesByCategory: Record<string, Array<{
        id: string;
        name: string;
        address: string | null;
        latitude: number;
        longitude: number;
        rating: number | null;
        travelTimes: Array<{
          drivingTime: number | null;
          walkingTime: number | null;
          transitTime: number | null;
          distance: number | null;
        }>;
      }>> = {}
      for (const amenity of (profile.amenities ?? [])) {
        const categoryKey = amenity.category ?? 'uncategorized'
        if (!amenitiesByCategory[categoryKey]) {
          amenitiesByCategory[categoryKey] = []
        }
        const list = amenitiesByCategory[categoryKey]
        list.push({
          id: amenity.id,
          name: amenity.name,
          address: amenity.address,
          latitude: amenity.latitude,
          longitude: amenity.longitude,
          rating: amenity.rating,
          travelTimes: amenity.travelTimes || []
        })
      }

      console.log(`📊 Grouped amenities by category:`, Object.keys(amenitiesByCategory))

      // Calculate summary with actual counts
      const totalAmenities = Object.values(amenitiesByCategory).flat().length
      const summary: Record<string, number> = {
        totalAmenities: totalAmenities
      }
      
      // Add category-specific counts
      Object.entries(amenitiesByCategory).forEach(([category, amenities]) => {
        summary[category] = amenities.length
      })

      return {
        profile: {
          id: profile.id,
          profileName: profile.profileName,
          createdAt: profile.createdAt,
          isActive: profile.isActive,
          categories: categories,
          isAdHoc: profile.isAdHoc || false,
          adHocAddress: profile.adHocAddress || null,
          adHocLatitude: profile.adHocLatitude || null,
          adHocLongitude: profile.adHocLongitude || null,
          propertyId: profile.propertyId
        },
        amenitiesByCategory: amenitiesByCategory,
        summary: {
          totalAmenities: totalAmenities,
          averageTime: profile.averageTime,
          propertyLocation: propertyLocation,
          ...summary
        }
      }
    } catch (error) {
      console.error('Error fetching distance profile by ID:', error)
      throw error
    }
  }

  /**
   * Calculate straight-line distance between two points
   */
  private calculateStraightLineDistance(point1: { lat: number; lng: number }, point2: { lat: number; lng: number }): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.toRad(point2.lat - point1.lat)
    const dLng = this.toRad(point2.lng - point1.lng)
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  /**
   * Delete a specific distance profile by ID
   * This method safely deactivates the profile instead of deleting it
   */
  async deleteDistanceProfileById(profileId: string) {
    try {
      // Instead of deleting, just deactivate the profile
      // This preserves all amenities and travel times
      await prisma.distanceProfile.update({
        where: { id: profileId },
        data: { 
          isActive: false,
          updatedAt: new Date()
        }
      })

      console.log(`Successfully deactivated distance profile: ${profileId}`)
      return true
    } catch (error) {
      console.error('Error deactivating distance profile:', error)
      throw error
    }
  }

  /**
   * Clean up old deactivated profiles (older than 30 days)
   * This prevents database bloat while preserving recent data
   */
  async cleanupOldDeactivatedProfiles() {
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      // Find deactivated profiles older than 30 days
      const oldProfiles = await prisma.distanceProfile.findMany({
        where: {
          isActive: false,
          updatedAt: {
            lt: thirtyDaysAgo
          }
        },
        select: { id: true }
      })

      if (oldProfiles.length === 0) {
        console.log('No old deactivated profiles to clean up')
        return { deleted: 0 }
      }

      // Get amenities for these profiles
      const amenities = await prisma.amenity.findMany({
        where: {
          profileId: { in: oldProfiles.map(p => p.id) }
        },
        select: { id: true }
      })

      // Delete travel times first
      if (amenities.length > 0) {
        await prisma.travelTime.deleteMany({
          where: {
            amenityId: { in: amenities.map(a => a.id) }
          }
        })
      }

      // Delete amenities
      if (amenities.length > 0) {
        await prisma.amenity.deleteMany({
          where: {
            profileId: { in: oldProfiles.map(p => p.id) }
          }
        })
      }

      // Delete the profiles
      await prisma.distanceProfile.deleteMany({
        where: {
          id: { in: oldProfiles.map(p => p.id) }
        }
      })

      console.log(`Cleaned up ${oldProfiles.length} old deactivated profiles`)
      return { deleted: oldProfiles.length }
    } catch (error) {
      console.error('Error cleaning up old profiles:', error)
      throw error
    }
  }

  /**
   * Delete a distance profile
   */
  async deleteDistanceProfile(propertyId: string) {
    try {
      // Find existing profile
      const existingProfile = await prisma.distanceProfile.findFirst({
        where: {
          propertyId: propertyId,
          isActive: true
        }
      })

      if (existingProfile) {
        // Delete all related data (cascade should handle this, but let's be explicit)
        await prisma.travelTime.deleteMany({
          where: {
            amenity: {
              profileId: existingProfile.id
            }
          }
        })

        await prisma.amenity.deleteMany({
          where: {
            profileId: existingProfile.id
          }
        })

        await prisma.distanceProfile.delete({
          where: {
            id: existingProfile.id
          }
        })
      }

      return true

    } catch (error) {
      console.error('Error deleting distance profile:', error)
      throw error
    }
  }

  /**
   * Update distance profile with new radius settings
   * Efficiently adds new amenities for categories with increased radius
   */
  async updateDistanceProfileRadius(
    profileId: string, 
    newDistances: Record<string, number>,
    refresh: boolean = false
  ) {
    try {
      // Get the existing profile with current amenities
      const existingProfile = await prisma.distanceProfile.findUnique({
        where: { id: profileId },
        include: {
          amenities: {
            include: {
              travelTimes: true
            }
          }
        }
      })

      if (!existingProfile) {
        throw new Error('Distance profile not found')
      }

      // Check if this is an ad-hoc profile (no propertyId)
      if (!existingProfile.propertyId) {
        throw new Error('Cannot refresh ad-hoc profiles. Please use updateDistanceProfile instead.')
      }

      // Get the property
      const property = await prisma.property.findUnique({
        where: { id: existingProfile.propertyId }
      })

      if (!property?.latitude || !property?.longitude) {
        throw new Error('Property coordinates are required')
      }

      if (!refresh) {
        // Just update the timestamp without re-searching
        await prisma.distanceProfile.update({
          where: { id: profileId },
          data: {
            updatedAt: new Date()
          }
        })
        return await this.getDistanceProfileById(profileId)
      }

      // Find categories that had their radius increased
      const categoriesToSearch: string[] = []
      const currentDistances = existingProfile.categories as Record<string, number> || {}
      
      for (const [category, newRadius] of Object.entries(newDistances)) {
        const currentRadius = currentDistances[category] || 0
        if (newRadius > currentRadius) {
          categoriesToSearch.push(category)
        }
      }

      if (categoriesToSearch.length === 0) {
        // No radius increases, just update timestamp
        await prisma.distanceProfile.update({
          where: { id: profileId },
          data: {
            updatedAt: new Date()
          }
        })
        return await this.getDistanceProfileById(profileId)
      }

      // Get existing amenities by category to avoid duplicates
      const existingAmenities = existingProfile.amenities
      const existingByCategory: Record<string, Set<string>> = {}
      
      existingAmenities.forEach(amenity => {
        const key = amenity.category ?? 'uncategorized'
        if (!existingByCategory[key]) {
          existingByCategory[key] = new Set()
        }
        const set = existingByCategory[key]
        set.add(amenity.placeId || amenity.name)
      })

      // Search only the categories with increased radius
      const newAmenities = await this.searchAmenitiesForCategories(
        property.latitude,
        property.longitude,
        categoriesToSearch,
        newDistances,
        existingByCategory
      )

      // Add new amenities to the existing profile
      let addedCount = 0
      for (const amenity of newAmenities) {
        const savedAmenity = await prisma.amenity.create({
          data: {
            name: amenity.name,
            address: amenity.formatted_address || amenity.vicinity || '',
            latitude: amenity.geometry.location.lat,
            longitude: amenity.geometry.location.lng,
            category: amenity.category,
            rating: amenity.rating || 0,
            profileId: profileId,
            placeId: amenity.place_id || ''
          }
        })

        // Calculate travel times for the new amenity
        if (amenity.travelTimes && amenity.travelTimes.length > 0) {
          for (const travelTime of amenity.travelTimes) {
            await prisma.travelTime.create({
              data: {
                propertyId: property.id,
                amenityId: savedAmenity.id,
                drivingTime: travelTime.drivingTime,
                walkingTime: travelTime.walkingTime,
                transitTime: travelTime.transitTime,
                distance: travelTime.distance
              }
            })
          }
        }
        addedCount++
      }

      // Update the profile with new distances and amenity count
      await prisma.distanceProfile.update({
        where: { id: profileId },
        data: {
          categories: newDistances,
          totalAmenities: existingProfile.totalAmenities + addedCount,
          updatedAt: new Date()
        }
      })

      return await this.getDistanceProfileById(profileId)
    } catch (error) {
      console.error('Error updating distance profile radius:', error)
      throw error
    }
  }

  /**
   * Search amenities for specific categories with increased radius
   */
  private async searchAmenitiesForCategories(
    latitude: number,
    longitude: number,
    categories: string[],
    distances: Record<string, number>,
    existingAmenities: Record<string, Set<string>>
  ) {
    interface TravelTime {
      drivingTime: number | null
      walkingTime: number | null
      transitTime: number | null
      distance: number | null
    }

    type NewAmenity = {
      place_id?: string
      name: string
      formatted_address?: string
      vicinity?: string
      geometry: { location: { lat: number; lng: number } }
      rating?: number
      category: string
      travelTimes?: TravelTime[]
    }

    const allAmenities: NewAmenity[] = []
    
    for (const category of categories) {
      const radius = distances[category] || 2.0
      const existing = existingAmenities[category] || new Set()
      
      try {
        // Search for amenities in this category
        const places = await this.googleMaps.searchNearbyPlaces(
          { lat: latitude, lng: longitude },
          radius,
          undefined,
          category
        )
        
        // Filter out existing amenities
        const newPlaces = places.filter(place => {
          const identifier = place.place_id || place.name
          return !existing.has(identifier)
        })
        
        // Calculate travel times for new amenities
        for (const place of newPlaces) {
          const travelTimes = await this.googleMaps.calculateTravelTimes(
            { lat: latitude, lng: longitude },
            [{ lat: place.geometry.location.lat, lng: place.geometry.location.lng }]
          )
          // Map into our amenity structure with category and travel times
          const amenity: NewAmenity = {
            place_id: place.place_id,
            name: place.name,
            formatted_address: place.formatted_address,
            vicinity: place.vicinity,
            geometry: place.geometry,
            rating: place.rating,
            category,
            travelTimes: (travelTimes.rows?.[0]?.elements || []).map(el => ({
              drivingTime: el.duration?.value ?? null,
              walkingTime: null,
              transitTime: null,
              distance: el.distance?.value ?? null
            }))
          }
          allAmenities.push(amenity)
        }
        
      } catch (error) {
        console.error(`Error searching for ${category}:`, error)
        // Continue with other categories even if one fails
      }
    }
    
    return allAmenities
  }
}

// Export a singleton instance
export const distanceProfileService = new DistanceProfileService()
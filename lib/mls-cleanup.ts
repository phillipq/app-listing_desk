import { Prisma, PrismaClient } from '@prisma/client'
import { mlsService } from './mls'
import { vectorSearchService } from './vector-search'

const prisma = new PrismaClient()

export interface CleanupStats {
  totalProperties: number
  staleProperties: number
  removedProperties: number
  updatedProperties: number
  errors: number
}

export class MLSCleanupService {
  private staleThresholdDays = 7 // Properties older than 7 days are considered stale

  // Main cleanup function - runs daily
  async performDailyCleanup(): Promise<CleanupStats> {
    console.log('🧹 Starting daily MLS cleanup...')
    
    const stats: CleanupStats = {
      totalProperties: 0,
      staleProperties: 0,
      removedProperties: 0,
      updatedProperties: 0,
      errors: 0
    }

    try {
      // Get all cached properties with MLS IDs
      const allProperties = await prisma.property.findMany({
        where: {
          mlsId: { not: null }
        },
        select: {
          mlsId: true,
          updatedAt: true,
          rawData: true
        }
      })

      stats.totalProperties = allProperties.length
      console.log(`📊 Found ${stats.totalProperties} cached properties`)

      // Identify stale properties
      const staleDate = new Date(Date.now() - this.staleThresholdDays * 24 * 60 * 60 * 1000)
      const staleProperties = allProperties.filter(prop => 
        prop.updatedAt < staleDate && prop.mlsId !== null
      )

      stats.staleProperties = staleProperties.length
      console.log(`📊 Found ${stats.staleProperties} stale properties`)

      // Process stale properties
      for (const property of staleProperties) {
        if (!property.mlsId) continue
        
        try {
          const isStillValid = await this.validateProperty(property.mlsId)
          
          if (isStillValid) {
            // Update the property data
            await this.updateProperty(property.mlsId)
            stats.updatedProperties++
            console.log(`✅ Updated property ${property.mlsId}`)
          } else {
            // Remove stale property
            await this.removeProperty(property.mlsId)
            stats.removedProperties++
            console.log(`🗑️ Removed stale property ${property.mlsId}`)
          }
        } catch (error) {
          console.error(`❌ Error processing property ${property.mlsId}:`, error)
          stats.errors++
        }
      }

      // Clean up expired cache entries
      await this.cleanupExpiredCache()

      console.log('✅ Daily cleanup completed:', stats)
      return stats

    } catch (error) {
      console.error('❌ Error during daily cleanup:', error)
      throw error
    }
  }

  // Validate if a property is still active
  private async validateProperty(mlsId: string): Promise<boolean> {
    try {
      // Try to fetch the property from the MLS API
      const property = await mlsService.getPropertyById(mlsId)
      
      if (!property) {
        return false // Property not found in MLS
      }

      // Check if property is still active (status is stored in rawData or we check via MLS)
      // Note: Status checking would need to be implemented based on actual MLS API response
      return true // Property is still valid
    } catch (error) {
      console.error(`Error validating property ${mlsId}:`, error)
      return false // Assume invalid if we can't check
    }
  }

  // Update property data
  private async updateProperty(mlsId: string): Promise<void> {
    try {
      const property = await mlsService.getPropertyById(mlsId)
      
      if (property) {
        // Find existing property to get realtorId
        const existing = await prisma.property.findUnique({
          where: { mlsId },
          select: { realtorId: true }
        })

        if (!existing) {
          console.warn(`Cannot update property ${mlsId}: property not found in database`)
          return
        }

        // Update the cached property
        await prisma.property.update({
          where: { mlsId },
          data: {
            address: property.address,
            city: property.city,
            province: property.province,
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            propertyType: property.propertyType,
            squareFootage: property.squareFootage ?? undefined,
            images: property.images || [],
            rawData: property as unknown as Prisma.InputJsonValue,
            updatedAt: new Date()
          }
        })

        // Update vector embeddings if they exist
        try {
          const embedding = await vectorSearchService.generateEmbeddings(property as unknown as import('./vector-search').PropertyData)
          await vectorSearchService.storePropertyEmbedding(embedding)
        } catch (error) {
          console.error(`Error updating embeddings for ${mlsId}:`, error)
        }
      }
    } catch (error) {
      console.error(`Error updating property ${mlsId}:`, error)
      throw error
    }
  }

  // Remove stale property
  private async removeProperty(mlsId: string): Promise<void> {
    try {
      // Remove from property cache
      await prisma.property.delete({
        where: { mlsId }
      })

      // Remove from vector embeddings
      await prisma.$executeRaw`
        DELETE FROM property_embeddings 
        WHERE mls_id = ${mlsId}
      `

      console.log(`🗑️ Removed property ${mlsId} from cache and embeddings`)
    } catch (error) {
      console.error(`Error removing property ${mlsId}:`, error)
      throw error
    }
  }

  // Clean up expired cache entries
  private async cleanupExpiredCache(): Promise<void> {
    const expiredDate = new Date(Date.now() - this.cacheExpiryHours * 24 * 60 * 60 * 1000)
    
    const deleted = await prisma.property.deleteMany({
      where: {
        updatedAt: {
          lt: expiredDate
        }
      }
    })
    
    console.log(`🗑️ Cleaned up ${deleted.count} expired cache entries`)
  }

  // Get cleanup statistics
  async getCleanupStats(): Promise<{
    totalProperties: number
    staleProperties: number
    expiredProperties: number
    lastCleanup: Date | null
  }> {
    const totalProperties = await prisma.property.count()
    
    const staleDate = new Date(Date.now() - this.staleThresholdDays * 24 * 60 * 60 * 1000)
    const staleProperties = await prisma.property.count({
      where: {
        updatedAt: {
          lt: staleDate
        },
        mlsId: { not: null }
      }
    })

    const expiredDate = new Date(Date.now() - this.cacheExpiryHours * 24 * 60 * 60 * 1000)
    const expiredProperties = await prisma.property.count({
      where: {
        updatedAt: {
          lt: expiredDate
        },
        mlsId: { not: null }
      }
    })

    return {
      totalProperties,
      staleProperties,
      expiredProperties,
      lastCleanup: null // TODO: Track last cleanup time
    }
  }

  private get cacheExpiryHours() {
    return 24 // Cache expires after 24 hours
  }
}

export const mlsCleanupService = new MLSCleanupService()

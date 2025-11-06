import { Prisma, PrismaClient } from '@prisma/client'
import { vectorSearchService } from './vector-search'

const prisma = new PrismaClient()

export interface PropertyFilters {
  city?: string
  province?: string
  location?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  propertyType?: string
}

export interface PropertyData {
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
  images?: string[]
  description?: string
  rawData?: Record<string, unknown>
  [key: string]: unknown
}

export interface CachedProperty {
  mlsId: string
  mlsNumber: string
  address: string
  city: string
  province: string
  price: number
  bedrooms: number
  bathrooms: number
  propertyType: string
  squareFootage?: number
  images: string[]
  lastUpdated: Date
  data: PropertyData // Full property data from API
}

export class PropertyCacheService {
  private cacheExpiryHours = 24 // Cache properties for 24 hours

  // Get cached properties or fetch from API (SHARED across all realtors)
  async getProperties(filters: PropertyFilters, _mlsService: { searchProperties: (filters: PropertyFilters) => Promise<PropertyData[]> }): Promise<PropertyData[]> {
    // First, try to get from cache (shared across all realtors)
    const cachedProperties = await this.getCachedProperties(filters)
    
    if (cachedProperties.length > 0) {
      console.log(`📦 Using ${cachedProperties.length} cached properties from database`)
      return cachedProperties
    }

    // If no cached properties match the filters, get all cached properties and filter them
    console.log('🔍 No exact cached matches, getting all cached properties for filtering...')
    const allCachedProperties = await prisma.property.findMany({
      where: { status: 'active' },
      orderBy: { updatedAt: 'desc' },
      take: 100
    })

    if (allCachedProperties.length > 0) {
      console.log(`📦 Found ${allCachedProperties.length} total cached properties, will filter client-side`)
      return allCachedProperties.map(prop => ({
        id: prop.mlsId || prop.id,
        mlsId: prop.mlsId || prop.id,
        mlsNumber: undefined,
        address: prop.address,
        city: prop.city,
        province: prop.province,
        price: prop.price,
        bedrooms: prop.bedrooms,
        bathrooms: prop.bathrooms,
        propertyType: prop.propertyType,
        squareFootage: prop.squareFootage ?? undefined,
        images: prop.images || [],
        description: prop.description ?? undefined,
        features: [],
        status: prop.status || 'active',
        daysOnMarket: prop.daysOnMarket ?? undefined,
        matchPercentage: 85, // Default match percentage
        smartMatchDetails: {
          mustHaveMatches: [],
          niceToHaveMatches: []
        },
        proximityData: [],
        proximityScore: null,
        rawData: prop.rawData as unknown as Record<string, unknown>
      }))
    }

    // No cached properties found - return empty array
    console.log('📭 No cached properties found in database')
    return []
  }

  // Get properties from cache that match filters
  private async getCachedProperties(filters: PropertyFilters): Promise<PropertyData[]> {
    const whereClause: {
      status?: string
      city?: { contains: string; mode: 'insensitive' }
      province?: { contains: string; mode: 'insensitive' }
      address?: { contains: string; mode: 'insensitive' }
      price?: { gte?: number; lte?: number }
      bedrooms?: { gte?: number }
      bathrooms?: { gte?: number }
      propertyType?: { contains: string; mode: 'insensitive' }
      OR?: Array<{
        city?: { contains: string; mode: 'insensitive' }
        province?: { contains: string; mode: 'insensitive' }
        address?: { contains: string; mode: 'insensitive' }
      }>
    } = {
      status: 'active'
      // Remove cache expiry check - use all cached properties
    }

    // Add filters to where clause - map location to city/province
    if (filters.location) {
      whereClause.OR = [
        { city: { contains: filters.location, mode: 'insensitive' } },
        { province: { contains: filters.location, mode: 'insensitive' } },
        { address: { contains: filters.location, mode: 'insensitive' } }
      ]
    }
    if (filters.minPrice) {
      whereClause.price = { ...whereClause.price, gte: filters.minPrice }
    }
    if (filters.maxPrice) {
      whereClause.price = { ...whereClause.price, lte: filters.maxPrice }
    }
    if (filters.bedrooms) {
      whereClause.bedrooms = { gte: filters.bedrooms }
    }
    if (filters.bathrooms) {
      whereClause.bathrooms = { gte: filters.bathrooms }
    }
    if (filters.propertyType) {
      whereClause.propertyType = { contains: filters.propertyType, mode: 'insensitive' }
    }

    const cachedProperties = await prisma.property.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      take: 50 // Limit to 50 most recent
    })

    // Transform back to API format
    return cachedProperties.map(prop => ({
      id: prop.mlsId || prop.id,
      mlsId: prop.mlsId || prop.id,
      mlsNumber: undefined,
      address: prop.address,
      city: prop.city,
      province: prop.province,
      price: prop.price,
      bedrooms: prop.bedrooms,
      bathrooms: prop.bathrooms,
      propertyType: prop.propertyType,
      squareFootage: prop.squareFootage ?? undefined,
      images: prop.images || [],
      description: prop.description ?? undefined,
      features: [],
      status: prop.status || 'active',
      daysOnMarket: prop.daysOnMarket ?? undefined,
      matchPercentage: 85, // Default match percentage
      smartMatchDetails: {
        mustHaveMatches: [],
        niceToHaveMatches: []
      },
      proximityData: [],
      proximityScore: null,
      rawData: prop.rawData as unknown as Record<string, unknown>
    }))
  }

  // Cache properties in database with embeddings
  async cacheProperties(properties: PropertyData[]): Promise<void> {
    console.log(`💾 Caching ${properties.length} properties with embeddings...`)
    
    // Get the first realtor ID for caching (shared cache)
    const firstRealtor = await prisma.realtor.findFirst()
    if (!firstRealtor) {
      throw new Error('No realtor found in database. Please create a realtor first.')
    }
    
    for (const property of properties) {
      try {
        // Cache the property
        const _cachedProperty = await prisma.property.upsert({
          where: { mlsId: property.mlsId || property.id },
          update: {
            realtorId: firstRealtor.id,
            address: property.address,
            city: property.city,
            province: property.province,
            postalCode: typeof property.postalCode === 'string' ? property.postalCode : (typeof property.zipCode === 'string' ? property.zipCode : null),
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            propertyType: property.propertyType,
            squareFootage: property.squareFootage,
            images: property.images,
            description: (typeof property.description === 'string' ? property.description : null) || 
                         (typeof property.remarks === 'string' ? property.remarks : null) || 
                         (typeof property.publicRemarks === 'string' ? property.publicRemarks : null) || 
                         null,
            // Store the full raw data for comprehensive details
            rawData: property as unknown as Prisma.InputJsonValue
          },
          create: {
            realtorId: firstRealtor.id,
            mlsId: property.mlsId || property.id,
            address: property.address,
            city: property.city,
            province: property.province,
            postalCode: typeof property.postalCode === 'string' ? property.postalCode : (typeof property.zipCode === 'string' ? property.zipCode : null),
            price: property.price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            propertyType: property.propertyType,
            squareFootage: property.squareFootage,
            images: property.images,
            description: (typeof property.description === 'string' ? property.description : null) || 
                         (typeof property.remarks === 'string' ? property.remarks : null) || 
                         (typeof property.publicRemarks === 'string' ? property.publicRemarks : null) || 
                         null,
            // Store the full raw data for comprehensive details
            rawData: property as unknown as Prisma.InputJsonValue
          }
        })

        // Generate and store embeddings for vector search
        await this.generateAndStoreEmbeddings(property)
        
      } catch (error) {
        console.error(`Error caching property ${property.mlsId}:`, error)
      }
    }
    
    console.log('✅ Properties cached with embeddings successfully')
  }

  // Generate and store embeddings for a property
  private async generateAndStoreEmbeddings(property: PropertyData): Promise<void> {
    try {
      // Create searchable text for embeddings
      const description = property.description || ''
      const features = Array.isArray(property.features) ? property.features.join(' ') : (property.features || '')
      const amenities = Array.isArray(property.amenities) ? property.amenities.join(' ') : (property.amenities || '')
      const combined = `${description} ${features} ${amenities} ${property.parking || ''} ${property.heating || ''} ${property.cooling || ''} ${property.neighborhood || ''}`.trim()

      if (combined.length < 10) return // Skip if no meaningful text

      // Generate embeddings using the correct method
      const embeddings = await vectorSearchService.generateEmbeddings(property)

      // Store embeddings using raw SQL to bypass Prisma vector limitations
      await prisma.$executeRaw`
        INSERT INTO "PropertyEmbedding" (
          "id", "mlsId", "propertyData", 
          "descriptionEmbedding", "featuresEmbedding", "combinedEmbedding",
          "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid(), ${property.mlsId || property.id}, ${JSON.stringify(property)}::jsonb,
          ${JSON.stringify(embeddings.descriptionEmbedding)}::vector,
          ${JSON.stringify(embeddings.featuresEmbedding)}::vector,
          ${JSON.stringify(embeddings.combinedEmbedding)}::vector,
          NOW(), NOW()
        )
        ON CONFLICT ("mlsId") 
        DO UPDATE SET
          "propertyData" = ${JSON.stringify(property)}::jsonb,
          "descriptionEmbedding" = ${JSON.stringify(embeddings.descriptionEmbedding)}::vector,
          "featuresEmbedding" = ${JSON.stringify(embeddings.featuresEmbedding)}::vector,
          "combinedEmbedding" = ${JSON.stringify(embeddings.combinedEmbedding)}::vector,
          "updatedAt" = NOW()
      `

      console.log(`🧠 Generated embeddings for property ${property.mlsId}`)
    } catch (error) {
      console.error(`Error generating embeddings for property ${property.mlsId}:`, error)
    }
  }

  // Clear expired cache
  async clearExpiredCache(): Promise<void> {
    const expiredDate = new Date(Date.now() - this.cacheExpiryHours * 60 * 60 * 1000)
    
    const deleted = await prisma.property.deleteMany({
      where: {
        updatedAt: {
          lt: expiredDate
        }
      }
    })
    
    console.log(`🗑️ Cleared ${deleted.count} expired properties from cache`)
  }

  // Get cache statistics
  async getCacheStats(): Promise<{ total: number; expired: number; recent: number }> {
    const total = await prisma.property.count()
    const expired = await prisma.property.count({
      where: {
        updatedAt: {
          lt: new Date(Date.now() - this.cacheExpiryHours * 60 * 60 * 1000)
        }
      }
    })
    const recent = total - expired
    
    return { total, expired, recent }
  }
}

export const propertyCacheService = new PropertyCacheService()

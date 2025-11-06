import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { prisma } from './prisma'

const _supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Property data interfaces - using flexible approach for complex data structures
export interface PropertyData {
  mlsId: string
  id?: string
  [key: string]: unknown // Allow for flexible property structure with unknown for complex nested data
}

export interface PropertyEmbedding {
  mlsId: string
  propertyData: PropertyData
  descriptionEmbedding?: number[]
  featuresEmbedding?: number[]
  combinedEmbedding?: number[]
}

export class VectorSearchService {
  // Generate embeddings for property text
  async generateEmbeddings(property: PropertyData): Promise<PropertyEmbedding> {
    try {
      // Handle both our internal format and Repliers API format
      const isRepliersFormat = property.details && property.address
      
      let descriptionText = ''
      let featuresText = ''
      let _amenitiesText = ''
      let _neighborhoodText = ''
      let _heatingText = ''
      let _coolingText = ''
      let _extrasText = ''
      let _styleText = ''
      let _flooringText = ''
      let _foundationText = ''
      let combinedText = ''

      if (isRepliersFormat) {
        // Repliers API format - safely handle all fields with null/empty/N/A checks
        const details = (property.details && typeof property.details === 'object') ? property.details as Record<string, unknown> : {}
        const address = (property.address && typeof property.address === 'object') ? property.address as Record<string, unknown> : {}
        
        // Helper function to safely extract text values
        const safeText = (value: unknown): string => {
          if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'null') {
            return ''
          }
          return String(value).trim()
        }
        
        const safeNumber = (value: unknown): number => {
          if (value === null || value === undefined || value === '' || value === 'N/A') {
            return 0
          }
          const num = Number(value)
          return isNaN(num) ? 0 : num
        }
        
        // Extract description text
        descriptionText = safeText(property.description) || safeText(property.remarks) || safeText(property.publicRemarks) || ''
        
        // Extract features text
        featuresText = [
          safeText(details.extras),
          safeText(details.airConditioning),
          safeText(details.heating),
          safeText(details.flooringType),
          safeText(details.foundationType),
          safeText(details.HOAFee),
          safeText(details.sewer),
          safeText(details.waterSource),
          safeText(details.zoning)
        ].filter(text => text && text.trim().length > 0).join(' ')
        
        // Extract amenities text
        const amenities = property.amenities
        _amenitiesText = Array.isArray(amenities) ? safeText(amenities.join(' ')) : ''
        
        // Extract neighborhood text
        _neighborhoodText = [
          safeText(address.neighborhood),
          safeText(address.area),
          safeText(address.district),
          safeText(address.majorIntersection)
        ].filter(text => text && text.trim().length > 0).join(' ')
        
        // Extract heating/cooling text
        _heatingText = safeText(details.heating) || ''
        _coolingText = safeText(details.airConditioning) || ''
        
        // Extract extras text
        _extrasText = safeText(details.extras) || ''
        
        // Extract style text
        _styleText = safeText(details.style) || ''
        
        // Extract flooring text
        _flooringText = safeText(details.flooringType) || ''
        
        // Extract foundation text
        _foundationText = safeText(details.foundationType) || ''
        
        // Create combined text for comprehensive embedding
        combinedText = [
          // Address info
          safeText(address.streetNumber),
          safeText(address.streetName),
          safeText(address.streetSuffix),
          safeText(address.city),
          safeText(address.state),
          safeText(address.zip),
          safeText(address.neighborhood),
          safeText(address.area),
          
          // Property details
          safeText(details.propertyType),
          safeText(details.style),
          safeText(property.class),
          safeText(property.status),
          safeText(property.type),
          `${safeNumber(details.numBedrooms)} bedroom`,
          `${safeNumber(details.numBathrooms)} bathroom`,
          `${safeNumber(details.numBathroomsHalf)} half bathroom`,
          
          // Size and features
          `${safeNumber(details.sqft)} square feet`,
          `${safeNumber(details.yearBuilt)} built`,
          `${safeNumber(details.lotSize)} lot`,
          safeText(details.extras),
          safeText(details.airConditioning),
          safeText(details.heating),
          safeText(details.flooringType),
          safeText(details.foundationType),
          safeText(details.HOAFee),
          safeText(details.sewer),
          safeText(details.waterSource),
          safeText(details.zoning),
          
          // Description and features
          safeText(property.description),
          safeText(property.virtualTourUrl),
          
          // Timestamps
          safeText(property.listDate),
          safeText(property.soldDate),
          safeText(property.originalPrice),
          safeText(property.assignment),
          safeText(property.lastStatus),
          safeText(property.daysOnMarket),
          
          // Estimate info
          ...(property.estimate && typeof property.estimate === 'object' ? [
            safeText((property.estimate as Record<string, unknown>).value),
            safeText((property.estimate as Record<string, unknown>).confidence)
          ] : []),
          
          // Image insights
          ...(Array.isArray(property.imageInsights) 
            ? property.imageInsights.map((insight: unknown) => {
                if (insight && typeof insight === 'object') {
                  const insightObj = insight as Record<string, unknown>
                  return safeText(insightObj.description)
                }
                return ''
              })
            : [])
        ].filter(text => text && text.trim().length > 0).join(' ')
      } else {
        // Internal format with safe handling
        const safeText = (value: unknown): string => {
          if (value === null || value === undefined || value === '' || value === 'N/A' || value === 'null') {
            return ''
          }
          return String(value).trim()
        }
        
        const safeNumber = (value: unknown): number => {
          if (value === null || value === undefined || value === '' || value === 'N/A') {
            return 0
          }
          const num = Number(value)
          return isNaN(num) ? 0 : num
        }
        
        descriptionText = safeText(property.description) || ''
        const features = property.features
        featuresText = Array.isArray(features) ? safeText(features.join(' ')) : ''
        const amenities = property.amenities
        _amenitiesText = Array.isArray(amenities) ? safeText(amenities.join(' ')) : ''
        _neighborhoodText = safeText(property.neighborhood) || ''
        _heatingText = safeText(property.heating) || ''
        _coolingText = safeText(property.cooling) || ''
        _extrasText = safeText(property.extras) || ''
        _styleText = safeText(property.style) || ''
        _flooringText = safeText(property.flooringType) || ''
        _foundationText = safeText(property.foundationType) || ''
        
        combinedText = [
          safeText(property.address),
          safeText(property.city),
          safeText(property.province),
          safeText(property.propertyType),
          safeText(property.description),
          safeText(property.neighborhood),
          safeText(property.heating),
          safeText(property.cooling),
          safeText(property.parking),
          `${safeNumber(property.bedrooms)} bedroom`,
          `${safeNumber(property.bathrooms)} bathroom`,
          `${safeNumber(property.squareFootage)} square feet`,
          `${safeNumber(property.yearBuilt)} built`,
          `${safeNumber(property.lotSize)} lot`
        ].filter(text => text && text.trim().length > 0).join(' ')
      }

      // Generate embeddings for each text type
      const [descriptionEmbedding, featuresEmbedding, combinedEmbedding] = await Promise.all([
        this.createEmbedding(descriptionText),
        this.createEmbedding(featuresText),
        this.createEmbedding(combinedText)
      ])

      return {
        mlsId: property.mlsId || property.id || '',
        propertyData: property,
        descriptionEmbedding,
        featuresEmbedding,
        combinedEmbedding
      }
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw error
    }
  }

  // Create embedding from text using OpenAI
  async createEmbedding(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      return []
    }

    // Ensure we have a non-empty string for embedding
    const inputText = text.trim() || 'property listing'
    
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: inputText
    })
    
    return response.data[0]?.embedding || []
  }

  // Store property embedding in database
  async storePropertyEmbedding(embedding: PropertyEmbedding): Promise<void> {
    try {
      await prisma.$executeRaw`
        INSERT INTO "PropertyEmbedding" ("mlsId", "propertyData", "descriptionEmbedding", "featuresEmbedding", "combinedEmbedding", "createdAt", "updatedAt")
        VALUES (${embedding.mlsId}, ${JSON.stringify(embedding.propertyData)}::jsonb, ${embedding.descriptionEmbedding}::vector, ${embedding.featuresEmbedding}::vector, ${embedding.combinedEmbedding}::vector, NOW(), NOW())
        ON CONFLICT ("mlsId") 
        DO UPDATE SET 
          "propertyData" = ${JSON.stringify(embedding.propertyData)}::jsonb,
          "descriptionEmbedding" = ${embedding.descriptionEmbedding}::vector,
          "featuresEmbedding" = ${embedding.featuresEmbedding}::vector,
          "combinedEmbedding" = ${embedding.combinedEmbedding}::vector,
          "updatedAt" = NOW()
      `
    } catch (error) {
      console.error('Error storing property embedding:', error)
      throw error
    }
  }

  // Search for similar properties using vector similarity
  async searchSimilarProperties(
    query: string,
    filters: {
      location?: string
      minPrice?: number
      maxPrice?: number
      propertyType?: string
      bedrooms?: number
      bathrooms?: number
    },
    limit: number = 15
  ): Promise<Array<Record<string, unknown> & { similarity_score?: number; vector_distance?: number }>> {
    try {
      // Generate embedding for the search query
      const queryEmbedding = await this.createEmbedding(query)
      
      if (queryEmbedding.length === 0) {
        console.log('No query embedding generated, falling back to traditional search')
        return await this.fallbackTraditionalSearch(filters, limit, query)
      }

      console.log(`🔍 Performing vector similarity search for: "${query}"`)
      console.log(`📊 Query embedding dimensions: ${queryEmbedding.length}`)

      // Try vector search first
      try {
        console.log('🔍 Attempting vector similarity search...')
        
        // Use raw SQL for vector similarity search
        const results = await prisma.$queryRaw`
          SELECT 
            p.*,
            pe."combinedEmbedding",
            (1 - (pe."combinedEmbedding" <=> ${queryEmbedding}::vector)) as similarity_score
          FROM "Property" p
          LEFT JOIN "PropertyEmbedding" pe ON p."mlsId" = pe."mlsId"
          WHERE p."status" = 'active'
            AND pe."combinedEmbedding" IS NOT NULL
          ORDER BY pe."combinedEmbedding" <=> ${queryEmbedding}::vector
          LIMIT ${limit * 2}
        `
        
        interface VectorSearchResult {
          [key: string]: unknown
          similarity_score?: number
          propertyType?: string
          bedrooms?: number
          bathrooms?: number
          price?: number
        }
        
        const typedResults = results as VectorSearchResult[]
        console.log(`📊 Vector search found ${typedResults.length} properties`)
        
        if (typedResults.length > 0) {
          // Apply additional filters to vector results
          const filteredResults = typedResults.filter(item => {
            const property = item
            
            // Apply property type filter
            if (filters.propertyType) {
              const propertyTypeMap: Record<string, string[]> = {
                'house': ['residential'],
                'home': ['residential'],
                'residential': ['residential'],
                'land': ['land'],
                'lease': ['residential lease']
              }
              
              const mappedTypes = propertyTypeMap[filters.propertyType.toLowerCase()] || [filters.propertyType]
              const propertyType = typeof property.propertyType === 'string' ? property.propertyType : ''
              if (!mappedTypes.includes(propertyType)) return false
            }
            
            // Apply bedroom filter
            if (filters.bedrooms) {
              const bedrooms = typeof property.bedrooms === 'number' ? property.bedrooms : 0
              if (bedrooms < filters.bedrooms) return false
            }
            
            // Apply bathroom filter
            if (filters.bathrooms) {
              const bathrooms = typeof property.bathrooms === 'number' ? property.bathrooms : 0
              if (bathrooms < filters.bathrooms) return false
            }
            
            // Apply price filters
            if (filters.minPrice) {
              const price = typeof property.price === 'number' ? property.price : 0
              if (price < filters.minPrice) return false
            }
            if (filters.maxPrice) {
              const price = typeof property.price === 'number' ? property.price : Infinity
              if (price > filters.maxPrice) return false
            }
            
            return true
          })
          
          console.log(`📊 After filtering: ${filteredResults.length} properties`)
          
          return filteredResults.slice(0, limit).map(property => ({
            ...property,
            similarity_score: property.similarity_score || 0,
            vector_distance: 1 - (property.similarity_score || 0)
          }))
        }
      } catch (vectorError) {
        console.error('Vector search failed, falling back to traditional search:', vectorError)
      }
      
      // Fall back to traditional search if vector search fails
      console.log('🔍 Falling back to traditional search')
      return await this.fallbackTraditionalSearch(filters, limit, query)
    } catch (error) {
      console.error('Error in vector search:', error)
      return await this.fallbackTraditionalSearch(filters, limit, query)
    }
  }

  // Fallback to traditional search when vector search fails
  private async fallbackTraditionalSearch(
    filters: {
      location?: string
      minPrice?: number
      maxPrice?: number
      propertyType?: string
      bedrooms?: number
      bathrooms?: number
    },
    limit: number = 15,
    query?: string
  ): Promise<Array<Record<string, unknown> & { similarity_score?: number; vector_distance?: number }>> {
    try {
      console.log('🔍 Using traditional database search as fallback')
      
      // Build Prisma query for Property table
      const whereClause: {
        status?: 'active'
        OR?: Array<{
          city?: { contains: string; mode: 'insensitive' }
          province?: { contains: string; mode: 'insensitive' }
          address?: { contains: string; mode: 'insensitive' }
        }>
        price?: { gte?: number; lte?: number }
        propertyType?: { in: string[] }
        bedrooms?: { gte: number }
        bathrooms?: { gte: number }
      } = {
        status: 'active'
      }

      // Add location filter
      if (filters.location) {
        whereClause.OR = [
          { city: { contains: filters.location, mode: 'insensitive' } },
          { province: { contains: filters.location, mode: 'insensitive' } },
          { address: { contains: filters.location, mode: 'insensitive' } }
        ]
      }

      // Add price filters
      if (filters.minPrice || filters.maxPrice) {
        whereClause.price = {}
        if (filters.minPrice) whereClause.price.gte = filters.minPrice
        if (filters.maxPrice) whereClause.price.lte = filters.maxPrice
      }

      // Add property type filter
      if (filters.propertyType) {
        // Map common property type requests to actual database values
        const propertyTypeMap: { [key: string]: string[] } = {
          'house': ['residential'],
          'home': ['residential'],
          'residential': ['residential'],
          'land': ['land'],
          'lease': ['residential lease']
        }
        
        const mappedTypes = propertyTypeMap[filters.propertyType.toLowerCase()] || [filters.propertyType]
        whereClause.propertyType = { in: mappedTypes }
      }

      // Add bedroom filter
      if (filters.bedrooms) {
        whereClause.bedrooms = { gte: filters.bedrooms }
      }

      // Add bathroom filter
      if (filters.bathrooms) {
        whereClause.bathrooms = { gte: filters.bathrooms }
      }

      console.log('📊 Search filters:', whereClause)

      const properties = await prisma.property.findMany({
        where: whereClause,
        select: {
          id: true, mlsId: true, address: true, city: true, province: true, postalCode: true,
          price: true, bedrooms: true, bathrooms: true, propertyType: true, squareFootage: true,
          description: true, images: true, yearBuilt: true, status: true, daysOnMarket: true,
          rawData: true
        },
        orderBy: { price: 'asc' },
        take: limit * 2 // Get more results for text filtering
      })

      console.log(`📊 Found ${properties.length} properties from database`)

      // Apply text-based semantic matching on descriptions and raw data
      const textFilteredProperties = properties.filter(property => {
        const rawData = property.rawData as Record<string, unknown> | null
        const searchableText = [
          property.description || '',
          property.address || '',
          property.city || '',
          property.province || '',
          // Extract text from rawData if available (neighborhood, heating, cooling, parking may be in rawData)
          ...(rawData ? this.extractTextFromRawData(rawData) : [])
        ].join(' ').toLowerCase()

        // If we have a specific query, use it for matching
        if (query && query.trim()) {
          const queryTerms = query.toLowerCase().split(/\s+/)
          return queryTerms.some(term => searchableText.includes(term))
        }

        // Fallback to general property terms if no specific query
        const searchTerms = [
          'covered deck', 'deck', 'outdoor', 'patio', 'porch',
          'luxury', 'custom', 'premium', 'high-end', 'gourmet',
          'fireplace', 'kitchen', 'dining', 'entertaining',
          'mountain views', 'lake', 'golf', 'gated', 'private',
          'doors', 'floor to ceiling', 'stone', 'alder'
        ]

        return searchTerms.some(term => searchableText.includes(term.toLowerCase()))
      })

      console.log(`📊 After text filtering: ${textFilteredProperties.length} properties`)

      return textFilteredProperties.slice(0, limit).map(property => ({
        ...property,
        similarity_score: 0.8,
        vector_distance: 0.2
      }))

    } catch (error) {
      console.error('Fallback traditional search error:', error)
      return []
    }
  }

  // Extract text from raw data for semantic search
  private extractTextFromRawData(rawData: Record<string, unknown>): string[] {
    const textParts: string[] = []
    
    try {
      if (rawData.details && typeof rawData.details === 'object') {
        const details = rawData.details as Record<string, unknown>
        textParts.push(
          String(details.extras || ''),
          String(details.airConditioning || ''),
          String(details.heating || ''),
          String(details.flooringType || ''),
          String(details.foundationType || ''),
          String(details.HOAFee || ''),
          String(details.sewer || ''),
          String(details.waterSource || ''),
          String(details.zoning || ''),
          String(details.style || '')
        )
      }
      
      if (rawData.address && typeof rawData.address === 'object') {
        const address = rawData.address as Record<string, unknown>
        textParts.push(
          String(address.neighborhood || ''),
          String(address.area || ''),
          String(address.district || ''),
          String(address.majorIntersection || '')
        )
      }
      
      if (rawData.rooms && Array.isArray(rawData.rooms)) {
        rawData.rooms.forEach((room: unknown) => {
          if (room && typeof room === 'object') {
            const roomObj = room as Record<string, unknown>
            textParts.push(String(roomObj.description || ''))
            textParts.push(String(roomObj.features || ''))
            textParts.push(String(roomObj.features2 || ''))
          }
        })
      }
      
      if (rawData.agents && Array.isArray(rawData.agents)) {
        rawData.agents.forEach((agent: unknown) => {
          if (agent && typeof agent === 'object') {
            const agentObj = agent as Record<string, unknown>
            textParts.push(String(agentObj.name || ''))
            textParts.push(String(agentObj.position || ''))
            if (agentObj.brokerage && typeof agentObj.brokerage === 'object') {
              const brokerage = agentObj.brokerage as Record<string, unknown>
              textParts.push(String(brokerage.name || ''))
            }
          }
        })
      }
      
      if (rawData.office && typeof rawData.office === 'object') {
        const office = rawData.office as Record<string, unknown>
        textParts.push(String(office.name || ''))
        textParts.push(String(office.address || ''))
      }
      
      if (rawData.nearby && typeof rawData.nearby === 'object') {
        const nearby = rawData.nearby as Record<string, unknown>
        if (nearby.amenities && Array.isArray(nearby.amenities)) {
          nearby.amenities.forEach((amenity: unknown) => {
            if (amenity && typeof amenity === 'object') {
              const amenityObj = amenity as Record<string, unknown>
              textParts.push(String(amenityObj.name || ''))
              textParts.push(String(amenityObj.type || ''))
            }
          })
        }
      }
      
      if (rawData.lot && typeof rawData.lot === 'object') {
        const lot = rawData.lot as Record<string, unknown>
        textParts.push(String(lot.legalDescription || ''))
        textParts.push(String(lot.features || ''))
      }
      
      if (rawData.taxes && typeof rawData.taxes === 'object') {
        const taxes = rawData.taxes as Record<string, unknown>
        textParts.push(String(taxes.description || ''))
      }
      
      if (rawData.timestamps && typeof rawData.timestamps === 'object') {
        const timestamps = rawData.timestamps as Record<string, unknown>
        textParts.push(String(timestamps.listDate || ''))
        textParts.push(String(timestamps.soldDate || ''))
      }
      
      if (rawData.estimate && typeof rawData.estimate === 'object') {
        const estimate = rawData.estimate as Record<string, unknown>
        textParts.push(String(estimate.value || ''))
        textParts.push(String(estimate.confidence || ''))
      }
      
      if (rawData.imageInsights && Array.isArray(rawData.imageInsights)) {
        rawData.imageInsights.forEach((insight: unknown) => {
          if (insight && typeof insight === 'object') {
            const insightObj = insight as Record<string, unknown>
            textParts.push(String(insightObj.description || ''))
          }
        })
      }
    } catch (error) {
      console.error('Error extracting text from rawData:', error)
    }

    return textParts.filter(text => text && text.trim().length > 0)
  }

  // Search by requirements (must-haves and nice-to-haves)
  async searchByRequirements(
    mustHaves: string[],
    niceToHaves: string[],
    filters: { location?: string; propertyType?: string; bedrooms?: number; bathrooms?: number; priceRange?: { min?: number; max?: number } },
    limit: number = 15
  ): Promise<PropertyData[]> {
    try {
      // Create search query from requirements
      const searchQuery = `${mustHaves.join(' ')} ${niceToHaves.join(' ')}`
      
      // Search for similar properties
      const results = await this.searchSimilarProperties(searchQuery, filters, limit)
      
      // Calculate match scores based on how well they match requirements
      return results.map(property => {
        const description = typeof property.description === 'string' ? property.description : ''
        const features = Array.isArray(property.features) ? property.features.join(' ') : ''
        const amenities = Array.isArray(property.amenities) ? property.amenities.join(' ') : ''
        const propertyText = `${description} ${features} ${amenities}`.toLowerCase()
        
        const mustHaveMatches = mustHaves.filter(requirement => 
          propertyText.includes(requirement.toLowerCase())
        )
        
        const niceToHaveMatches = niceToHaves.filter(requirement => 
          propertyText.includes(requirement.toLowerCase())
        )
        
        const matchScore = (mustHaves.length > 0 ? (mustHaveMatches.length / mustHaves.length) * 0.7 : 0) + 
                          (niceToHaves.length > 0 ? (niceToHaveMatches.length / niceToHaves.length) * 0.3 : 0)
        
        const similarityScore = typeof property.similarity_score === 'number' ? property.similarity_score : 0
        
        return {
          ...property,
          mlsId: typeof property.mlsId === 'string' ? property.mlsId : (typeof property.id === 'string' ? property.id : ''),
          matchScore,
          mustHaveMatches,
          niceToHaveMatches,
          semanticSimilarity: similarityScore
        } as PropertyData & { matchScore: number; mustHaveMatches: string[]; niceToHaveMatches: string[]; semanticSimilarity: number }
      }).sort((a, b) => b.matchScore - a.matchScore)

    } catch (error) {
      console.error('Error searching by requirements:', error)
      // Return empty array instead of throwing to allow fallback to traditional search
      return []
    }
  }

  // Batch process properties to generate and store embeddings
  async processPropertiesForEmbeddings(properties: PropertyData[]): Promise<void> {
    console.log(`🔄 Processing ${properties.length} properties for embeddings...`)
    
    for (const property of properties) {
      try {
        const embedding = await this.generateEmbeddings(property)
        await this.storePropertyEmbedding(embedding)
        console.log(`✅ Processed property ${property.mlsId || property.id}`)
      } catch (error) {
        console.error(`❌ Error processing property ${property.mlsId || property.id}:`, error)
      }
    }
    
    console.log(`✅ Completed processing ${properties.length} properties`)
  }
}

export const vectorSearchService = new VectorSearchService()

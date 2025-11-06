import OpenAI from 'openai'
import { prisma } from './prisma'
import { VectorService } from './vector-service'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const vectorService = new VectorService()

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
  // Generate embeddings for property text using VectorService
  async generateEmbeddings(property: PropertyData): Promise<PropertyEmbedding> {
    try {
      const embeddings = await vectorService.generatePropertyEmbeddings(property as unknown as Parameters<typeof vectorService.generatePropertyEmbeddings>[0])
      
      return {
        mlsId: property.mlsId || property.id || '',
        propertyData: property,
        descriptionEmbedding: embeddings.description,
        featuresEmbedding: embeddings.features,
        combinedEmbedding: embeddings.combined
      }
    } catch (error) {
      console.error('Error generating embeddings:', error)
      throw error
    }
  }

  // Legacy method - keeping for backward compatibility
  async generateEmbeddingsLegacy(property: PropertyData): Promise<PropertyEmbedding> {
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

  // Store property embedding in database using VectorService
  async storePropertyEmbedding(embedding: PropertyEmbedding): Promise<void> {
    try {
      await vectorService.storePropertyEmbedding(
        embedding.mlsId,
        embedding.propertyData as unknown as Parameters<typeof vectorService.storePropertyEmbedding>[1],
        {
          description: embedding.descriptionEmbedding || [],
          features: embedding.featuresEmbedding || [],
          combined: embedding.combinedEmbedding || []
        }
      )
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
      realtorId?: string
    },
    limit: number = 5
  ): Promise<Array<Record<string, unknown> & { similarity_score?: number; vector_distance?: number; matchPercentage?: number }>> {
    try {
      // Clean the query text
      const cleanQuery = query.trim()
      console.log(`🔍 Performing vector similarity search for: "${cleanQuery}"`)

      // Try vector search first using VectorService
      try {
        const vectorResults = await vectorService.searchSimilarProperties(
          cleanQuery,
          0.3, // Lower threshold for better matching
          limit
        )

        if (vectorResults && vectorResults.length > 0) {
          console.log(`📊 Vector search found ${vectorResults.length} properties`)
          
          // Convert vector results to expected format
          return vectorResults.map(result => {
            const propertyData = result.property_data as Record<string, unknown>
            return {
              ...propertyData,
              mlsId: result.mls_id,
              similarity_score: result.similarity,
              matchPercentage: Math.round(result.similarity * 100),
              smartMatchDetails: {
                mustHaveMatches: [],
                niceToHaveMatches: []
              },
              proximityData: [],
              proximityScore: null,
              vector_distance: 1 - result.similarity
            }
          })
        }
      } catch (vectorError) {
        console.log('🔍 Vector search failed, falling back to traditional search:', (vectorError as Error).message)
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
      realtorId?: string
    },
    limit: number = 15,
    query?: string
  ): Promise<Array<Record<string, unknown> & { similarity_score?: number; vector_distance?: number; matchPercentage?: number }>> {
    try {
      console.log('🔍 Using traditional database search as fallback')
      
      // Build Prisma query for Property table
      const whereClause: {
        status?: 'active'
        realtorId?: string
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

      // Add realtor filter if provided
      if (filters.realtorId) {
        whereClause.realtorId = filters.realtorId
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

      // Add bathroom filter (more flexible - include properties with 1 less bathroom)
      if (filters.bathrooms) {
        const minBathrooms = Math.max(1, filters.bathrooms - 1) // Allow 1 less bathroom
        whereClause.bathrooms = { gte: minBathrooms }
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
      
      // Debug: Show which properties were returned
      if (properties.length > 0) {
        console.log('📊 Properties returned from database:')
        properties.slice(0, 5).forEach((property, index) => {
          console.log(`  ${index + 1}. ${property.mlsId} - ${property.address} (${property.bedrooms}bed/${property.bathrooms}bath)`)
        })
      }

      // Apply enhanced semantic matching with relevance scoring
      const scoredProperties = properties.map(property => {
        const rawData = property.rawData as Record<string, unknown> | null
        const searchableText = [
          property.description || '',
          property.address || '',
          property.city || '',
          property.province || '',
          // Extract text from rawData if available (neighborhood, heating, cooling, parking may be in rawData)
          ...(rawData ? this.extractTextFromRawData(rawData as unknown as PropertyData) : [])
        ].join(' ').toLowerCase()

        let relevanceScore = 0
        const matchDetails = {
          exactPhrase: false,
          termMatches: 0,
          totalTerms: 0,
          descriptionMatch: false,
          addressMatch: false
        }

        if (query && query.trim()) {
          const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2)
          matchDetails.totalTerms = queryTerms.length

          // Check for exact phrase match (highest score)
          if (searchableText.includes(query.toLowerCase())) {
            relevanceScore += 100
            matchDetails.exactPhrase = true
          }

          // Check for individual term matches
          const termMatches = queryTerms.filter(term => searchableText.includes(term))
          matchDetails.termMatches = termMatches.length
          relevanceScore += termMatches.length * 20

          // Bonus for description matches
          if (property.description && property.description.toLowerCase().includes(query.toLowerCase())) {
            relevanceScore += 30
            matchDetails.descriptionMatch = true
          }

          // Bonus for address matches
          if (property.address && property.address.toLowerCase().includes(query.toLowerCase())) {
            relevanceScore += 15
            matchDetails.addressMatch = true
          }

          // Bonus for neighborhood matches (from rawData if available)
          const rawData = property.rawData as Record<string, unknown> | null
          if (rawData && rawData.address && typeof rawData.address === 'object') {
            const address = rawData.address as Record<string, unknown>
            const neighborhood = address.neighborhood
            if (neighborhood && String(neighborhood).toLowerCase().includes(query.toLowerCase())) {
              relevanceScore += 10
            }
          }
          
          // Debug logging for specific properties
          if (property.mlsId === 'CAR4114001' || property.mlsId === 'CAR4114002' || property.mlsId === 'CAR4114003') {
            console.log(`🔍 Debug ${property.mlsId}:`)
            console.log(`   Query: "${query}"`)
            console.log(`   Description: "${property.description}"`)
            console.log(`   Searchable text contains query: ${searchableText.includes(query.toLowerCase())}`)
            console.log(`   Relevance score: ${relevanceScore}`)
            console.log(`   Match details:`, matchDetails)
          }
        } else {
          // If no query, give all properties a base score
          relevanceScore = 1
        }

        return {
          ...property,
          relevanceScore,
          matchDetails
        }
      })

      // Filter properties that have some relevance and sort by score
      const relevantProperties = scoredProperties
        .filter(property => property.relevanceScore > 0)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
      
      // If no relevant properties found, return all properties sorted by price
      if (relevantProperties.length === 0) {
        console.log('📊 No semantic matches found, returning all properties sorted by price')
        const fallbackProperties = scoredProperties
          .sort((a, b) => a.price - b.price)
          .slice(0, limit)
        
        return fallbackProperties.map(property => {
          const rawData = property.rawData as Record<string, unknown> | null
          const features = rawData && Array.isArray(rawData.features) ? rawData.features : []
          return {
            ...property,
            images: property.images || [],
            features,
            status: property.status || 'active',
            daysOnMarket: property.daysOnMarket,
            matchPercentage: 50, // Default match percentage for fallback
            smartMatchDetails: {
              mustHaveMatches: [],
              niceToHaveMatches: []
            },
            proximityData: [],
            proximityScore: null,
            similarity_score: 0.5,
            vector_distance: 0.5
          }
        })
      }

      console.log(`📊 After semantic matching: ${relevantProperties.length} properties`)
      
      // Log top matches for debugging
      if (relevantProperties.length > 0) {
        console.log('📊 Top matches:')
        relevantProperties.slice(0, 3).forEach((property, index) => {
          console.log(`  ${index + 1}. ${property.mlsId} - ${property.address} (Score: ${property.relevanceScore})`)
          console.log(`     Description: ${property.description}`)
        })
      }

      return relevantProperties.slice(0, limit).map(property => {
        // Calculate dynamic match percentage based on relevance score
        const maxPossibleScore = 100 + 30 + 15 + 10 // exact phrase + description + address + neighborhood bonuses
        const dynamicMatchPercentage = Math.min(95, Math.max(60, Math.round((property.relevanceScore / maxPossibleScore) * 100)))
        
        const rawData = property.rawData as Record<string, unknown> | null
        const features = rawData && Array.isArray(rawData.features) ? rawData.features : []
        return {
          ...property,
          images: property.images || [],
          features,
          status: property.status || 'active',
          daysOnMarket: property.daysOnMarket,
          matchPercentage: dynamicMatchPercentage,
          smartMatchDetails: {
            mustHaveMatches: [],
            niceToHaveMatches: []
          },
          proximityData: [],
          proximityScore: null,
          similarity_score: dynamicMatchPercentage / 100,
          vector_distance: 1 - (dynamicMatchPercentage / 100)
        }
      })

    } catch (error) {
      console.error('Fallback traditional search error:', error)
      return []
    }
  }

  // Extract text from raw data for semantic search
  private extractTextFromRawData(rawData: PropertyData): string[] {
    const textParts: string[] = []
    
    // Helper function to safely convert any value to string
    const safeString = (value: unknown): string => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'string') return value
      if (typeof value === 'number') return value.toString()
      if (typeof value === 'boolean') return value.toString()
      if (Array.isArray(value)) return value.join(' ')
      if (typeof value === 'object') return JSON.stringify(value)
      return String(value)
    }
    
    try {
      if (rawData.details && typeof rawData.details === 'object') {
        const details = rawData.details as Record<string, unknown>
        textParts.push(
          safeString(details.extras),
          safeString(details.airConditioning),
          safeString(details.heating),
          safeString(details.flooringType),
          safeString(details.foundationType),
          safeString(details.HOAFee),
          safeString(details.sewer),
          safeString(details.waterSource),
          safeString(details.zoning),
          safeString(details.style)
        )
      }
      
      if (rawData.address && typeof rawData.address === 'object') {
        const address = rawData.address as Record<string, unknown>
        textParts.push(
          safeString(address.neighborhood),
          safeString(address.area),
          safeString(address.district),
          safeString(address.majorIntersection)
        )
      }
      
      if (rawData.rooms && Array.isArray(rawData.rooms)) {
        rawData.rooms.forEach((room: unknown) => {
          if (room && typeof room === 'object') {
            const roomObj = room as Record<string, unknown>
            textParts.push(safeString(roomObj.description))
            textParts.push(safeString(roomObj.features))
            textParts.push(safeString(roomObj.features2))
          }
        })
      }
      
      if (rawData.agents && Array.isArray(rawData.agents)) {
        rawData.agents.forEach((agent: unknown) => {
          if (agent && typeof agent === 'object') {
            const agentObj = agent as Record<string, unknown>
            textParts.push(safeString(agentObj.name))
            textParts.push(safeString(agentObj.position))
            textParts.push(safeString(agentObj.brokerage))
          }
        })
      }
      
      if (rawData.office && typeof rawData.office === 'object') {
        const office = rawData.office as Record<string, unknown>
        textParts.push(safeString(office.name))
        textParts.push(safeString(office.address))
      }
      
      if (rawData.nearby && typeof rawData.nearby === 'object') {
        const nearby = rawData.nearby as Record<string, unknown>
        if (nearby.amenities && Array.isArray(nearby.amenities)) {
          nearby.amenities.forEach((amenity: unknown) => {
            if (amenity && typeof amenity === 'object') {
              const amenityObj = amenity as Record<string, unknown>
              textParts.push(safeString(amenityObj.name))
              textParts.push(safeString(amenityObj.type))
            }
          })
        }
      }
      
      if (rawData.lot && typeof rawData.lot === 'object') {
        const lot = rawData.lot as Record<string, unknown>
        textParts.push(safeString(lot.legalDescription))
        textParts.push(safeString(lot.features))
      }
      
      if (rawData.taxes && typeof rawData.taxes === 'object') {
        const taxes = rawData.taxes as Record<string, unknown>
        textParts.push(safeString(taxes.description))
      }
      
      if (rawData.timestamps && typeof rawData.timestamps === 'object') {
        const timestamps = rawData.timestamps as Record<string, unknown>
        textParts.push(safeString(timestamps.listDate))
        textParts.push(safeString(timestamps.soldDate))
      }
      
      if (rawData.estimate && typeof rawData.estimate === 'object') {
        const estimate = rawData.estimate as Record<string, unknown>
        textParts.push(safeString(estimate.value))
        textParts.push(safeString(estimate.confidence))
      }
      
      if (rawData.imageInsights && Array.isArray(rawData.imageInsights)) {
        rawData.imageInsights.forEach((insight: unknown) => {
          if (insight && typeof insight === 'object') {
            const insightObj = insight as Record<string, unknown>
            textParts.push(safeString(insightObj.description))
          }
        })
      }
    } catch (error) {
      console.error('Error extracting text from rawData:', error)
    }

    return textParts.filter(text => text && typeof text === 'string' && text.trim().length > 0)
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
